---
layout: post
title: "영화 예매 사이트 개발하기 part 1"
date: 2019-01-11 13:30:30 +0900
written_by: "구르소"
description: "영화 예매 사이트를 만들고 싶었다. 그래서 간단하게 만들어봤다."
categories: ["server"]
tags: ["aws", "flask", "bootstrap4"]
comments: true
---

영화 예매 사이트를 만들고 싶었다. 그래서 간단하게 만들어봤다.

# 스택

back-end:
- Flask

front-end:
- jquery
- bootstrap4

database:
- aws RDS

server:
- aws EB with docker

Flask는 더 사용하기 쉽게 만든 [gureuso/flask](https://github.com/gureuso/Flask)를 사용했다. aws는 ECR/ECS를 써보려고 했는데 너무 어려워서 실패했다. 진짜 어렵다.
프론트는 부트스트랩4를 사용했는데 덕분에 되게 있어 보이게 만들어졌다.

# DB 설계

영화 예매시 영화 -> 영화관 -> 좌석 순으로 선택을 하게된다. 이 특징을 가지고 영화 예매 DB를 설계해봤다.

- users -> 유저
- movies -> 영화
- cinemas -> 영화관
- showtimes -> 상영시간
- theaters -> 극장
- theater_tickets -> 예매한좌석

![create-the-cinema-homepage-part-1-01](/assets/images/create-the-cinema-homepage-part-1-01.png)

`/v1/signin` 구글 로그인을 추가해봤다. access_token을 받아오는 방식도 있었지만, 프로필 정보만 필요했기 때문에 id_token을 얻어오는 방식을 사용했다.

![create-the-cinema-homepage-part-1-02](/assets/images/create-the-cinema-homepage-part-1-02.png)

`/v1/signup` 몇세 이상 관람가가 있어 회원가입 폼에 나이도 추가했다.

![create-the-cinema-homepage-part-1-03](/assets/images/create-the-cinema-homepage-part-1-03.gif)

`/v1/movies` 영화를 선택할 수 있게 해준다. `movies`는 영화 정보를 가지고 있는 테이블로 title, director, poster_url 등을 가지고 있다.

![create-the-cinema-homepage-part-1-04](/assets/images/create-the-cinema-homepage-part-1-04.png)

`/v1/cinemas` 영화를 선택했으면 영화관을 선택할 차례이다. 해당 페이지에서는 영화관 리스트를 보여준다. `cinemas`는 title, image_url, address 등을 가지고 있다.

![create-the-cinema-homepage-part-1-05](/assets/images/create-the-cinema-homepage-part-1-05.png)

`/v1/showtimes` 요일별 상영시간을 볼수 있고 남은 좌석을 확인할 수 있다.
`showtimes` 같은 경우에는 one to many 구조를 지향했고, movie_id와 cinema_id를 가지고 있게 함으로서 영화 예매 순서를 DB에 최대한 반영해봤다.

![create-the-cinema-homepage-part-1-06](/assets/images/create-the-cinema-homepage-part-1-06.gif)

`/v1/theater/<theater_id>/showtime/<showtime_id>` 좌석예매 같은 경우에는 상영시간 동안 극장 하나에 해당 좌석은 하나만 있어야 한다는 특징을 반영했다. `theater_tickets`에는 theater_id와 showtime_id를 가지게 된다. 덕분에 중복방지 코드를 작성하기가 한결 편해졌다.

![create-the-cinema-homepage-part-1-07](/assets/images/create-the-cinema-homepage-part-1-07.png)

![create-the-cinema-homepage-part-1-08](/assets/images/create-the-cinema-homepage-part-1-08.png)

이미 예매한 자리는 빨간색으로 구분을 줘서 사용하기 쉽게 만들었다.

# 마치며

백엔드를 하면서 느낀점은 `서버 = 데이터베이스`이다.
약간의 알고리즘을 제외하고는 DB에서 많은 부분을 해결할 수 있었다.
그만큼 DB가 중심이 되어야 한다는 점을 배우고 가는 것 같다.

스택에 aws를 사용했다고 했는데 DB 구조를 설명하느라 미처 설명하지 못했다. 다음편에 설명해야겠다.
다음편에서는 aws EB와 Docker에 대해 말해보려고 한다.
