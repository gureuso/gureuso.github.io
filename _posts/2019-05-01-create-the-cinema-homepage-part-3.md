---
layout: post
title: "영화 예매 사이트 개발하기 part 3"
date: 2019-05-01 22:13:49 +0900
written_by: "구르소"
categories: ["project"]
tags: ["react", "node.js", "next.js"]
comments: true
---

Flask로 만들었던 영화 예매 사이트를 React & Next.js로 이전하면서 겪었던 삽질 이야기를 해보려고 한다.

# 스택

back-end:
- Flask
- Express

front-end:
- Jquery
- Bootstrap4
- React
- Next.js

database:
- MySQL

server:
- Docker

# React

>React는 사용자 인터페이스를 만들기위해 페이스북과 인스타그램에서 개발한 오픈소스 
자바스크립트 라이브러리로써, 사용자 인터페이스(User Interface)에 집중하며, 
Virtual DOM을 통해 속도와 편의를 높이고, 단방향 데이터플로우를 지원하여 보일러플레이트 
코드를 감소시켜, 많은 사람들이 React를 MVC의 V를 고려하여 선택합니다. 즉, React는 
지속해서 데이터가 변하는 대규모어플리케이션의 구축이라는 하나의 문제를 풀기 위해서 
만들어졌습니다.
> http://webframeworks.kr/getstarted/reactjs/#tocAnchor-1-1

처음에 이해하지 못했던 부분이 자체 서버를 구동하는 것을 보고 Django나 Flask 서버 
프레임워크로 착각해버렸다. 사실은 MVC에 V역할을 하는 앱이였는데 말이다. 
그동안 내가 해왔던 프론트 프로그래밍은 html css jquery 수준으로 객체지향과는 거리가 
먼 사이였다. 하지만 React를 접하고 나서는 프론트에서도 객체지향을 할수 있구나와 
프론트 수준이 많이 올라 선 것을 느낄 수 있었다.

# Next.js

> 2016년 10월에 Zeit.co 팀에 의해 발표된 React JS를 이용한 서버 사이드 
렌더링 프레임워크 (SSR)
> http://webframeworks.kr/tutorials/nextjs/nextjs-001/#tocAnchor-1-1

사실 Next.js 기능은 거의 사용 안하고 프로젝트 구조만 활용하는 쪽을 선택했다. 
단순함과 깔끔한 구조가 내눈을 사로잡았다.

# Flask

```python
@app.route('', methods=['get'])
def main():
    movies = Movie.query.all()
    return ok(dict(movies=[movie.asdict() for movie in movies]))
```

기존 Flask로 만들어진 영화 예매 사이트를 API 서버로 만들어야 했다. 
랜더링 하는 부분을 전부 지우고 JSON을 리턴하게 변경했다.

## 프로젝트 구조

![create-the-cinema-homepage-part-3-01](/assets/images/create-the-cinema-homepage-part-3/01.png)

pages에 .js 파일을 생성하면 이름과 URL이 일치된다. index.js 파일을 생성하면 / URL이 생성된다.
static에는 js, css, images가 들어 있고 components에는 Layout과 Header 등 사이트 뼈대를 담당하는 코드가 들어있다.
server.js는 express로 만들어 졌는데 왜 express를 사용하게 됐는지는 이따 설명하려고 한다.

## 랜더링

```html
<div class="card-columns">
  for movie in movies
    <div class="card">
      <img class="card-img-top" src="{{ movie.poster_url }}" alt="poster image">
      <div class="card-body">
        <h4 class="card-title">{{ movie.title }}</h4>
        <p class="card-text">{{ movie.description }}</p>
        <ul class="list-group list-group-flush">
          <li class="list-group-item">감독: {{ movie.director }}</li>
          <li class="list-group-item">러닝타임: {{ movie.running_time }}분</li>
          <li class="list-group-item">관람가: {{ movie.age_rating }}세 이상 관람가</li>
        </ul>
        <br>
        <a href="/v1/cinemas?movie_id={{ movie.id }}" class="btn btn-primary">예매하기</a>
      </div>
    </div>
  endfor
</div>
```

```js
class Movies extends React.Component {
  create_movies() {
    const movies = this.props.data.movies;

    let movie_list = []
    for(let movie of movies) {
      movie_list.push(
        <div class="card">
          <img class="card-img-top" src={movie.poster_url} alt="poster image" />
          <div class="card-body">
            <h4 class="card-title">
              <a href={"/movies/"+movie.id}>{movie.title}</a>
            </h4>
            <p class="card-text">{movie.description}</p>
            <ul class="list-group list-group-flush">
              <li class="list-group-item">감독: {movie.director}</li>
              <li class="list-group-item">러닝타임: {movie.running_time}분</li>
              <li class="list-group-item">관람가: {movie.age_rating}세 이상 관람가</li>
            </ul>
            <br/>
            <a href={"/cinemas?movie_id="+movie.id} class="btn btn-primary">예매하기</a>
          </div>
        </div>
      );
    }
    return movie_list;
  }

  render() {
    return (
      <Layout title="Movies">
        <div class="card-columns">
          {this.create_movies()}
        </div>
      </Layout>
    );
  }
}
```

사실 적응이 많이 필요했던 부분인게 두 코드는 비슷해 보이지만 if else 사용 방법 등에서 차이가 있다.
파이썬에서는 php 처럼 코드 사이에 if else가 자유로운 반면에 React에서는 미리 코드를 통해 정의하고 랜더링 시 데이터 그대로 표시되게 된다.
물론 방법이야 있겠지만 직관적으로 코딩하기에는 제약사항이 많았다.

## 데이터 초기화

```js
static async getInitialProps(req) {
  let fetch_uri = 'https://apis.movie.gureuso.me/v1/movies';

  const res = await fetch(fetch_uri);
  const data = await res.json();
    
  return {
    data: data.data
  };
}
```

MVC의 V를 담당하는 앱답게 서버 요청을 받아서 데이터를 초기화 한다. 이 데이터를 가지고 랜더링을 하게 된다.

## RESTful 구현

아까 pages에 index.js 생성시 / URL이 생성된다고 했다. 그럼 `/movies/1` URL을 생성하려면 어떻게 해야할까?
여기서부터 골을 열심히 때리면서 생각해봤다. Doc에서는 외부 서버를 사용해야 한다고 하는데 
이해가 잘안되고 내부 코드를 사용시 이상하게 작동하고 머리만 아퍼가던 중 결국 외부 서버를 
만들어서 해결했다. 그게 바로 Express 서버이다.

```js
server.get('/movies/:id', (req, res) => {
  const page = '/movie';
  const params = {id: req.params.id};
  app.render(req, res, page, params)
});
```

`/movies/1` URL을 요청하면 `movies/1.js` 파일을 찾게 된다. 이 부분을 Express 라우팅을 통해 해결했다.

## 배포

배포 시 도커만한게 없더라. 평소처럼 DB 생성하고 API 연결하고 APP을 만들었다.

```dockerfile
FROM node:10.15.3
MAINTAINER gureuso <gureuso.github.io>

USER root
WORKDIR /root

# nextjs
RUN git clone https://github.com/gureuso/movie.git
WORKDIR /root/movie
RUN npm install

CMD npm run start

EXPOSE 3000
```

![create-the-cinema-homepage-part-3-02](/assets/images/create-the-cinema-homepage-part-3/02.png)

# 마치며

![create-the-cinema-homepage-part-3-03](/assets/images/create-the-cinema-homepage-part-3/03.png)

많은 API를 활용해서 화려하게는 만들지 못했지만 React를 체험하기 좋은 시간이였던 것 같다. 
러닝커브가 높아진 만큼 배움의 가치를 느낄수 있어서 좋았다. 
아직 용어 이해가 안되는 부분이 좀 있는데 복습하면서 다시 공부해봐야겠다.
