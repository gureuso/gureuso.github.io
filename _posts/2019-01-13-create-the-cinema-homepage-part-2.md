---
layout: post
title: "영화 예매 사이트 개발하기 part 2"
date: 2019-01-13 13:41:30 +0900
author: "구르소"
thumbnail: "/assets/images/create-the-cinema-homepage-part-2/01.png"
categories: ["project"]
tags: ["aws", "elastic beanstalk", "docker"]
comments: true
---

오랜만에 AWS EC2를 설치하고 영화 예매 사이트 배포를 위해서 패키지들을 설치하던 중 알수 없는 에러가 났다.
AWS가 amazon linux 2로 업그레이드 하면서 기존 방식으로는 설치가 되지 않았던 것이다.
결국 ubuntu에 설치를 해서 해결할 수 있었지만 너무 오래 걸렸다.
일관된 환경에서 배포를 하고싶은 마음이 생기게 된 계기였다.
이번 포스트에서는 일관된 환경을 제공하는 Docker와 배포를 쉽게 도와주는 AWS Elastic Beanstalk를 소개하려고 한다.

# Docker

> Docker는 애플리케이션을 신속하게 구축, 테스트 및 배포할 수 있는 소프트웨어 플랫폼입니다. Docker는 소프트웨어를 컨테이너라는 표준화된 유닛으로 패키징하며, 이 컨테이너에는 라이브러리, 시스템 도구, 코드, 런타임 등 소프트웨어를 실행하는 데 필요한 모든 것이 포함되어 있습니다. Docker를 사용하면 환경에 구애받지 않고 애플리케이션을 신속하게 배포 및 확장할 수 있으며 코드가 문제없이 실행될 것임을 확신할 수 있습니다.
> https://aws.amazon.com/ko/docker/

환경에 상관없이 배포를 할수 있다는 장점을 가지고 있다.
즉 어떤 플랫폼이 올려지더라도 도커만 설치되어 있다면 배포가 가능하다는 것이다.

## Dockerfile로 편하게 설치

```dockerfile
FROM centos:7
MAINTAINER gureuso <gureuso.github.io>

USER root
WORKDIR /root

# base
RUN yum update -y
RUN yum install -y epel-release
RUN yum install -y git python-pip python-devel gcc

# mysql
RUN yum -y install http://dev.mysql.com/get/mysql57-community-release-el7-11.noarch.rpm
RUN yum -y install mysql-community-client mysql-community-devel

# flask
RUN git clone https://github.com/gureuso/Flask.git
WORKDIR /root/Flask
RUN pip install virtualenv
RUN virtualenv venv
RUN . venv/bin/activate
RUN pip install -r requirements.txt

CMD python manage.py runserver

EXPOSE 80
```

제일 편했던 부분은 바로 Dockerfile이였다.
Docker만의 명령어와 쉘 스크립트를 지원하면서 직관적인 패키지 설치가 가능해졌다.

## Docker autobuild

![create-the-cinema-homepage-part-2-01](/assets/images/create-the-cinema-homepage-part-2/01.png)

또한 깃허브 webhook을 이용해 이벤트 발생시 자동으로 빌드해주는 옵션은 매번 이미지를 수동으로 빌드해줘야 하는 불편함을 해소시켜줬다.

## Docker network

```sh
$ docker network create -d bridge mybridge
$ docker run -d --net mybridge --name db redis
$ docker run -d --net mybridge -e DB=db -p 8000:5000 --name web chrch/web
```

![create-the-cinema-homepage-part-2-02](/assets/images/create-the-cinema-homepage-part-2/02.png)

https://blog.docker.com/2016/12/understanding-docker-networking-drivers-use-cases/

Docker는 컨테이너 끼리의 통신을 network 명령어로 풀어냈다. 위 예제처럼 컨테이너를 실행시킬 경우 `db` 키워드로 통신이 가능하다.
하지만 AWS RDS를 사용하게 되서 로컬 테스트 때만 실험을 해봤다. 유용해서 잠깐 언급해봤다.

# Elastic Beanstalk

> AWS Elastic Beanstalk는 Java, .NET, PHP, Node.js, Python, Ruby, Go, Docker를 사용하여 Apache, Nginx, Passenger, IIS와 같은 친숙한 서버에서 개발된 웹 애플리케이션 및 서비스를 간편하게 배포하고 조정할 수 있는 서비스입니다.
>
> https://aws.amazon.com/ko/elasticbeanstalk/

인프라를 구축할 필요없이 코드만 업로드하면 바로 사용할 수 있는 서비스이다. Docker도 지원해서 사용하게 됐다.

## Dockerrun.aws.json

```json
{
  "AWSEBDockerrunVersion": "1",
  "Authentication": {
    "Bucket": "gureuso-flask",
    "Key": "config.json"
  },
  "Image": {
    "Name": "gureuso/flask",
    "Update": "true"
  },
  "Ports": [
    {
      "ContainerPort": "80"
    }
  ]
}
```

dockerrun.aws.json을 작성하게 되면 Docker Hub에 빌드된 이미지를 AWS EB에서 사용할 수 있게 된다.

![create-the-cinema-homepage-part-2-03](/assets/images/create-the-cinema-homepage-part-2/03.png)

그럼 결국 위와 같은 구조가 나온다. git에 커밋을 하게되면 docker 이미지가 자동으로 빌드되고, AWS EB는 Docker Hub에 이미지를 로딩해 배포를 한다.

# 마치며

웹 어플리케이션을 배포하려면 항상 서버 설치와 웹서버 설정부터 생각했어야 했다.
이번에는 Docker와 AWS EB를 사용해서 그런 걱정 없이 배포할 수 있게 되었다.
반복 작업을 줄일 수 있게 되었고 코드에 더 집중할 수 있게 된것 같다.

단일 도커를 사용해서 영화 예매 사이트를 배포해봤는데 기회가 된다면 AWS ECR/ECS를 사용해서 멀티 도커 배포도 해보고 싶다.