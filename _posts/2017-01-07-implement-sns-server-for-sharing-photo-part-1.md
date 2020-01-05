---
layout: post
title: "사진 공유 SNS 서버 개발하기 part 1"
date: 2017-01-05 16:30:30 +0900
author: "구르소"
thumbnail: "/assets/images/implement-sns-server-for-sharing-photo-part-1/01.jpg"
categories: ["project"]
tags: ["python", "sns"]
comments: true
---

사진 공유 SNS 서버를 혼자 개발하게 됐다. ~~사실 잘해서 혼자 개발한건 아니고 나밖에 할 사람이 없었다.~~

뭐 이유야 어쨌든 기획 문서를 받고 어떻게 만들지 견적을 재봤다. 올리는 사람은 사진 or 영상을 업로드 할 수 있어야 했고, 보는 사람은 구독 또는 메인 페이지에서 확인할 수 있어야 했다. 자세한 사항은 다음과 같다.

- 이미지 또는 영상 업로드가 가능해야 한다.
- 업로드가 끝나면 메인 페이지와 구독함(구독시에만)에서 볼 수 있다.
- 유로와 무료 게시물이 존재하며, 유로 게시물은 코인을 지급해야 볼 수 있다.
- 게시물 구입 시 보관함에서 볼 수 있다.

이해 안되는 프로세스는 딱히 없었고 해당 기능을 사용하기 위해 만들어야 하는 시스템을 정리해봤다.

- 업로드 시스템
- 유로 게시물 보안 시스템
- 구독자를 위한 멀티 캐스트 시스템
- 정보 전달을 위한 푸시 시스템
- 결제 시스템

~~역시 입으로는 안되는게 없다.~~ 디테일은 하면서 챙기기로 했고, 개발 계획으로 넘어가기로 했다.

## 기술스택

기한이 매우 매우 촉박한 프로젝트라 기존 stack을 최대한 활용해 개발했다.

- Flask
- MongoDB
- Redis
- RabbitMQ
- Celery
- ShellScript
- AWS

RabbitMQ, Celery는 도입할 생각이 없었는데 업로드 시스템 성능 개선 때문에 도입하게 됐다.

## URL 리소스 접근 구조와 디렉토리 구조를 일치

![implement-sns-server-for-sharing-photo-part-1-01](/assets/images/implement-sns-server-for-sharing-photo-part-1/01.jpg){:width="400px"}

Flask는 구조에 대한 가이드 라인조차 없어서 매우 프리하다. 그래서 소스가 스파게티가 될수 있어서 조심해야한다. 이번 프로젝트는 MVC 패턴을 구현해보고 싶어서 최대한 비슷하게 구조를 짜봤다. apps 디렉토리가 API가 들어가는 메인 디렉토리이고 리소스 접근 방식과 동일하게 구조를 짰다.

- apis.example.com/ -> main 디렉토리
- apis.example.com/users -> users 디렉토리

각각의 디렉토리에는 \__init__.py, controllers.py, models.py가 있는데 \__init__.py는 패키지 명시, controllers.py는 routing을, models.py는 form validate, sql schema, 각종 함수들로 구성을 했다.

```py
app = Flask(__name__, static_url_path=STATIC_URL_PATH, static_folder=STATIC_FOLDER, template_folder=TEMPLATE_FOLDER,
            instance_relative_config=INSTANCE_RELATIVE_CONFIG)

app.config.update(
    DEBUG=DEBUG,
    SECRET_KEY=SECRET_KEY,
    MAX_CONTENT_LENGTH=MAX_CONTENT_LENGTH
)
```

static과 templates는 누구나 접근할수 있게 API와 분리했다.

## 핵심 리소스는 블루프린트로 관리

```py
from flask import Blueprint

apps_users = Blueprint('users', __name__, url_prefix='/users')


@apps_users.route('', methods=['POST'])
def user_create():
```

```py
from apps.main.controllers import apps_main
from apps.users.controllers import apps_users
from apps.follow.controllers import apps_follow
from apps.files.controllers import apps_files
```

```py
app.register_blueprint(apps_main)
app.register_blueprint(apps_users)
app.register_blueprint(apps_follow)
app.register_blueprint(apps_files)
```

Flask에서 route로 리소스를 명시할 때 전체적인 틀이 없다고 생각해서 이번에는 apps에서 디렉토리 별로 routing을 한 후 상위 리소스는 블루프린트로 관리하게 했다

url_prefix에서 상위 리소스를 고정하기 때문에 다른 함수를 걱정할 필요없이 그 파일 안에서만 신경을 써주면 되기 때문에 한결 편해졌다.

## RestFul한 API

> /users POST  # 유저가입
>
> /users/account GET  # 유저정보얻기
>
> /users/account PUT, PATCH  # 유저정보수정
>
> /users/account DELETE  # 유저삭제

action에 따른 method 구분을 확실히 함으로서 URL만 봐도 무슨 기능인지 알수 있게 했다.

## index.py만 실행하면 끝

```py
# -*- coding: utf-8 -*-
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from apps import app

application = app

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(sys.argv[1]) if len(sys.argv) > 1 else 7777, debug=True)
```

![implement-sns-server-for-sharing-photo-part-1-02](/assets/images/implement-sns-server-for-sharing-photo-part-1/02.jpg)

port를 사용해 개인 환경에서 개발을 할수 있게 했고, Web server 위에서 구동될 때 index.wsgi를 따로 만들 필요없이 한 번에 컨트롤 가능하게 만들었다.

