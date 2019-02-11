---
layout: post
title: "aiohttp를 활용한 파이썬 비동기 프로그래밍"
date: 2016-12-26 11:51:30 +0900
written_by: "구르소"
categories: ["programming"]
tags: ["python", "aiohttp", "gunicorn"]
comments: true
---

안녕하세요. 서버 개발자 윤정현입니다. 싱글 페이지 웹에서 동시에 다중 API 요청 시 block이 걸리는 문제를 경험하게 되었는데, 비동기 프로그래밍으로 해결한 경험을 공유하고 싶어 글을 쓰게 되었습니다.

# 문제발생

![aiohttp-python-async-programming-01](/assets/images/aiohttp-python-async-programming/01.jpg)

싱글 페이지 웹에서 동시에 다중 API 요청 시 CAUTION: Provisional headers are shown. 에러가 발생하고 나머지 requests를 요청하지 않는 문제가 발생했습니다.

```py
j = requests.request(
    method=request.method,
    url=route,
    auth=(key, password)
)
return ok(j.json(), dataOnly=True)
```

원인 파악을 했더니 다른 서버의 API를 호출하는 API가 처리 중에는 block 되어 문제가 발생하고 있었습니다. 자주 호출되는 API라 반드시 해결하고 넘어가야 했습니다.

# 해결방안 - aiohttp

aiohttp는 asyncio를 위한 HTTP client/server 모듈입니다. async 방식으로 작동하기 때문에 block 문제를 해결할 수 있을 것 같았습니다.

```py
import aiohttp

async with session.get(route) as resp:
    data = await resp.json()
```

하지만 기대와 달리 문제는 해결되지 않았습니다. 더 생각을 해보니 여러 URL을 호출하지 않기 때문에 코드 안에서의 async는 의미가 없었습니다. 또한 프레임워크의 network I/O block이 남아 있었습니다.

```py
from aiohttp import ClientSession, BasicAuth

from commons import ok


async def getProxy(request):
    args = request.GET
    route = args['route']
    key = args['key']
    password = args['password']
    
    print('start')

    async with ClientSession() as session:
        async with session.get(url=route, auth=BasicAuth(key, password)) as resp:
            data = await resp.json()

    print('end')

    return ok(data, onlyData=True)


def setupRoutes(app):
    routes = [
        ('GET', '/v1/proxy', getProxy, 'v1GetProxy')
    ]

    for route in routes:
        app.router.add_route(route[0], route[1], route[2], name=route[3])
```

결국 프레임워크를 바꾸게 되었고 aiohttp server 기능을 활용해 API를 작성하게 되었습니다.

![aiohttp-python-async-programming-02](/assets/images/aiohttp-python-async-programming/02.jpg){:width="400px"}

request 요청시 start와 end를 출력하게 했는데, 3개의 request를 동시에 받아 처리했고, 발생한 문제도 더 이상 나타나지 않았습니다.

# 다른 방법? - gunicorn

aiohttp는 아직 생태계가 갖춰져 있지 않아 지원하는 모듈들이 매우 적습니다. 그래서 메인 프레임워크로는 사용하지 못할꺼 같다는 판단을 내렸습니다.

다른 방법을 찾던 중 network I/O block을 효율적으로 해결할 방법을 찾게 되었습니다. gunicorn worker type 중 AsyncIO를 활용해 기존 소스를 비동기처럼 구현 가능하게 하는 방법을 찾았습니다. 적용방법도 매우 쉬웠습니다.

```sh
gunicorn --bind 0.0.0.0:7777 --workers 2 --worker-class "gaiohttp" index:app
```

python3을 사용중이지만 async 도입을 꺼려하시는 분들은 손쉽게 asynchronous I/O networking을 구현 가능하게 해주는 gunicorn의 gaiohttp를 추천드립니다.
