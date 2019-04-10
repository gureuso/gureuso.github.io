---
layout: post
title: "턴더페 프로젝트 part 3"
date: 2019-04-10 17:22:30 +0900
written_by: "구르소"
categories: ["project"]
tags: ["aws", "elb", "docker"]
comments: true
---

이번 편에서는 Docker와 AWS ELB를 활용해 서버를 구현한 이야기를 해보려고 한다.

# Server

## Docker

![turnthepage-project-part-3-01](/assets/images/turnthepage-project-part-3/01.png)

비용 문제로 EC2 프리티어를 가지고 구현하게 됐다.

```dockerfile
FROM python:3.5
MAINTAINER gureuso <wyun13043@gmail.com>

USER root
WORKDIR /root

#base
RUN apt-get -y update
RUN apt-get -y install python3-pip

#django
RUN git clone https://github.com/gureuso/turnthepage.git
WORKDIR /root/turnthepage
RUN pip install -r requirements.txt

EXPOSE 8000

CMD python manage.py makemigrations;python manage.py migrate;python manage.py runserver --insecure
```

장고 앱 배포를 위해 Dockerfile을 작성했다. 프로젝트는 깃허브에 올려 git clone으로 가져오게 했다.

```sh
docker build -t turnthepage:0.1 --no-cache /root/docker/turnthepage
docker build -t mysql:0.1 --no-cache /root/docker/mysql

docker run -d --net turnthepage --name db mysql:0.1 --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
docker run -d --net turnthepage --name turnthepage -p 8000:8000 -e DB_HOST=172.18.0.2 turnthepage:0.1
```

turnthepage 네트워크를 만들어 APP과 DB를 묶어 내부 통신 가능하게 만들었다.

## AWS ELB

![turnthepage-project-part-3-02](/assets/images/turnthepage-project-part-3/02.png)

gureuso.me 도메인을 구입하게 되었다. 도메인을 구입한 기념으로 turnthepage 프로젝트를 book.gureuso.me에 연결하게 되었다.

AWS에서 도메인을 구입하게 되면 ACM에서 발급 받은 인증서를 통해 ELB에 SSL를 적용할 수 있게 된다. 즉 https://book.gureuso.me 가 가능해진다는 것이다.

![turnthepage-project-part-3-03](/assets/images/turnthepage-project-part-3/03.png)

```python
# SSL/HTTPS
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True
```

https가 가능해졌고 http로 접속시 https로 리다이렉션 되게 해야했다. 이 부분은 장고 옵션을 통해 해결했다.

# 마치며

미루고 왔던 프로젝트가 드디어 끝났다. 차차 업그레이드를 통해 기능을 발전시킬 예정이다. 안드로이드 책 다 읽기가 목표인데 꾸준히 기록해서 클리어까지 해봐야겠다. 클리어 하면 안드로이드 프로젝트가 나를 기다리고 있겠지..

어쨌든 새로 배운 장고를 활용해 만든 첫 프로젝트 치고는 나쁘지 않았다.

끝.
