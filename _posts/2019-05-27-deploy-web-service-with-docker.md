---
layout: post
title: "도커로 웹 서비스 배포하기"
date: 2019-05-27 17:56:49 +0900
written_by: "구르소"
categories: ["server"]
tags: ["docker", "docker-compose"]
comments: true
---

개인 프로젝트를 진행하면서 만든 사이트 수가 제법 된다. 오늘은 도커로 여러 웹 서비스들을 하나로 묶어 관리한 이야기를 해보려고 한다.

# ELB

![deploy-web-service-with-docker-01](/assets/images/deploy-web-service-with-docker/01.png)

각각의 서비스들은 docker로 돌아가며 고유 포트번호를 가지고 있다. ELB는 도메인을 해당 포트로 리다이렉션 해주고 있다.
ACM에서 발급받은 인증서를 통해 https도 지원해 준다. 이 구조는 한 달도 못가 바꾸게 되었다. 무엇이 문제였을까?
바로 돈이였다.

> 1 load balancers x 0.025 USD x 730 hours in a month = 18.25 USD

한 개의 웹 서비스는 한 개의 로드밸런서를 가져야 한다. 이 구조의 치명적인 약점으로 결국 내 돈 $25.24를 가져갔다. ~~진짜 얄짤 없이 가져가더라.~~

무작정 서비스하고 치룬 대가였다. 그렇게 구조를 바꾸게 된 계기였다.

# Apache

```sh
<VirtualHost *:80>
    ServerName gureuso.me
    ServerAlias apis.movie.gureuso.me

    ProxyPass / http://gureuso.me:5001/
    ProxyPassReverse / http://gureuso.me:5001/
</VirtualHost>
```

ELB 일을 대신 해줄 녀석이 필요했다. 아파치 프록시 기능을 사용하기로 했다. 해당 도메인으로 접근 시 서비스에 맞는 포트번호로 연결 해주게 했다.

https는 인증서 비용 때문에 포기하기로 했다. ~~가난한 개발자의 슬픔이다.~~

설계를 바꾸긴 했지만 도메인을 서비스에 연결하는 것은 똑같이 구현했다.

# Docker

![create-the-cinema-homepage-part-3-02](/assets/images/create-the-cinema-homepage-part-3/02.png)

본론으로 돌아와서 이번에는 도커 관리에 문제가 생겼다. 웹 서비스들의 수가 늘면서 관리해야 할 도커 컨테이너들이 많아진 것이다.

운영하고 있는 서비스들은 APP, API, DB 등이 docker network로 묶여 있는 구조이다.

```sh
#!/bin/bash

docker stop admin_db
docker rm admin_db

docker build -t admin_db:0.1  --no-cache /root/docker/mysql
docker run -d -e MYSQL_DATABASE=admin --net admin --name admin_db admin_db:0.1 --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
```

커맨드는 run.sh 쉘 스크립트를 만들어서 관리하고 있고, 서버들은 docker network로 격리되어 있지만 결국 컨테이너 하나 씩 컨트롤 하고 있는 중이다.

한 서비스에 묶여 있는 도커 컨테이너들을 하나로 관리해야 할 필요성이 생긴 것이다.

결국 docker-compose를 도입하게 되었다.

# Docker Compose

> Compose is a tool for defining and running multi-container Docker applications.

여러 개의 도커 컨테이너들을 정의하고 실행하게 해주는 툴이라고 한다. ~~요즘 세상에는 이미 다 만들어져 있어서 잘 찾고 잘 쓰는 요령만 있어도 먹고 살것 같다는 생각이 종종 든다.~~

아무튼 run.sh 쉘 스크립트를 docker-compose.yml로 마이그레이션 하게 되었다.

```yml
version: '3'

services:
  proxy:
    image: nginx:latest
    ports:
      - '8000:8000'
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf
      - ./turnthepage:/var/www/turnthepage
    depends_on:
      - web
  web:
    build: .
    command: bash -c 'dockerize -wait tcp://db:3306 -timeout 30s && python manage.py makemigrations && python manage.py migrate && gunicorn --bind 0.0.0.0:8000 conf.wsgi:application'
    environment:
      - DJANGO_SETTINGS_MODULE=conf.settings.product
      - DB_USER_PASSWD=password
      - DB_HOST=db
    depends_on:
      - db
    volumes:
      - ./turnthepage:/root/turnthepage
    expose:
      - '8000'
  db:
    image: mysql:5.7
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=turnthepage
    volumes:
      - ./mysql/my.cnf:/etc/mysql/conf.d/my.cnf
      - db:/var/lib/mysql

volumes:
  db:
```

도커 커맨드를 옮긴 거라서 크게 설명할 부분은 없는 것 같다. 짚고 넘어가야 할 부분은 depends_on과 dockerize이다.

depends_on은 실행 순서에만 관여하고 완료까지는 간섭하지 않는다. 이렇게 될 경우 db -> web -> proxy 순으로 실행되지만 
db가 web보다 늦게 완료될 경우 db 연결을 하지 못하고 web 서비스가 종료될 수 있다.

```sh
command: bash -c 'dockerize -wait tcp://db:3306 -timeout 30s && python manage.py makemigrations && python manage.py migrate && gunicorn --bind 0.0.0.0:8000 conf.wsgi:application'
```

이 문제를 dockerize가 해결해주고 있다. dockerize는 커넥션이 될때까지 wait 해주는 녀석으로 앞서 말한 커넥션 종료 상황을 방지해준다.

```sh
- db:/var/lib/mysql
```

volumes를 빼먹었는데 DB 컨테이너가 사라질 경우 data도 같이 사라져 버린다. docker volume을 이용해서 컨테이너와 상관없이 데이터를 유지할 수 있게 만들었다.

![deploy-web-service-with-docker-02](/assets/images/deploy-web-service-with-docker/02.png)

해당 docker-compose.yml을 도식화했다. 기존 구조는 그대로지만 관리에 차이가 생겼다. 
예전에는 수 많은 컨테이너들을 커맨드로 일일이 관리했다면, 지금은 도식처럼 docker network 단위로 관리가 가능해졌다.

```sh
[root@ip-172-31-16-249 ~]# docker ps
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                            NAMES
1604b63b47d4        nginx:latest        "nginx -g 'daemon of…"   45 hours ago        Up 45 hours         80/tcp, 0.0.0.0:8001->8001/tcp   admin_proxy_1
f739a6076b5e        admin_web           "bash -c 'dockerize …"   45 hours ago        Up 45 hours         8000/tcp                         admin_web_1
ab5bd7325008        mysql:5.7           "docker-entrypoint.s…"   45 hours ago        Up 45 hours         3306/tcp, 33060/tcp              admin_db_1
71f4d9eb3f06        nginx:latest        "nginx -g 'daemon of…"   45 hours ago        Up 45 hours         80/tcp, 0.0.0.0:8000->8000/tcp   turnthepage_proxy_1
3be906e7182b        turnthepage_web     "bash -c 'dockerize …"   45 hours ago        Up 45 hours         8000/tcp                         turnthepage_web_1
fef5eb879c68        mysql:5.7           "docker-entrypoint.s…"   45 hours ago        Up 45 hours         3306/tcp, 33060/tcp              turnthepage_db_1
f2584f1c3468        nginx:latest        "nginx -g 'daemon of…"   46 hours ago        Up 46 hours         80/tcp, 0.0.0.0:5000->5000/tcp   flask_proxy_1
79f86c54a0f6        flask_web           "bash -c 'dockerize …"   46 hours ago        Up 46 hours         5000/tcp                         flask_web_1
35cb5bca4a7f        mysql:5.7           "docker-entrypoint.s…"   46 hours ago        Up 46 hours         3306/tcp, 33060/tcp              flask_db_1
da726b72406f        nginx:latest        "nginx -g 'daemon of…"   46 hours ago        Up 46 hours         80/tcp, 0.0.0.0:5001->5001/tcp   movie_proxy_1
7d806a2f923b        movie_api           "bash -c 'dockerize …"   46 hours ago        Up 46 hours         5000/tcp                         movie_api_1
1ec7eb548bb5        movie_web           "bash -c 'npm run st…"   46 hours ago        Up 46 hours         0.0.0.0:3000->3000/tcp           movie_web_1
0c02bcaf7c5d        mysql:5.7           "docker-entrypoint.s…"   46 hours ago        Up 46 hours         3306/tcp, 33060/tcp              movie_db_1
```

이제 이 많은 컨테이너들을 4개의 docker-compose로 관리가 가능해졌다.

# 마치며

도커와 프록시 기능을 활용해서 서버 배포를 진행해봤다. docker-compose 기능을 활용해서 쉬운 배포를 가능하게 했고, proxy를 통해 도메인 별로 서비스를 가능하게 했다.
개발하면서 느낀점은 뭐든 쉽고 편리해야지 좋은 서비스고 좋은 기능인것 같다. 쉽고 강력한 도커 기능들 덕분에 제법 그럴싸한 배포를 할수 있게 되었다. 이제 배포 시 도커를 빼놓고 이야기 할수 없게 된것 같다.

이번 경험을 통해서 더 큰 서비스에서는 도커를 어떻게 활용할 수 있을까? 라는 욕심을 생기게 해준 계기가 된것 같다. 좋은 경험이였다.
