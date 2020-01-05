---
layout: post
title: "턴더페 프로젝트 part 2"
date: 2019-04-10 16:11:30 +0900
author: "구르소"
thumbnail: "/assets/images/turnthepage-project-part-2/01.png"
categories: ["project"]
tags: ["bootstrap4"]
comments: true
---

저번 편에서는 백엔드 위주로 설명을 했다. 이번 편에서는 프론트 중심으로 설명을 해보려고 한다.

# Front

## signup

![turnthepage-project-part-2-01](/assets/images/turnthepage-project-part-2/01.png)

![turnthepage-project-part-2-02](/assets/images/turnthepage-project-part-2/02.png)

장고 자랑을 계속하게 되는데 폼 입력 값 검증도 해주고 에러도 출력해준다. 코드도 변수 값만 입력하는 수준이다. 폼 관련 사이트 만들 때는 장고만한게 없을꺼 같다.

## login

![turnthepage-project-part-2-03](/assets/images/turnthepage-project-part-2/03.png)

![turnthepage-project-part-2-04](/assets/images/turnthepage-project-part-2/04.png)

로그인은 이메일 또는 닉네임으로 접속할 수 있게 만들었다.

## book list

![turnthepage-project-part-2-05](/assets/images/turnthepage-project-part-2/05.png)

등록한 책들을 볼수 있는 페이지로 진도 퍼센트, 성공, 실패 여부 등을 알수 있다.

## book create

![turnthepage-project-part-2-06](/assets/images/turnthepage-project-part-2/06.png)

![turnthepage-project-part-2-07](/assets/images/turnthepage-project-part-2/07.png)

책을 등록할 수 있는 페이지이다.

## page create

![turnthepage-project-part-2-08](/assets/images/turnthepage-project-part-2/08.png)

책을 등록하면 진도를 나갈 수 있게 페이지라는 개념을 도입했다. 아직은 읽은 페이지와 댓글을 남기는 정도지만 목표 설정 이라던지 다양한 기능을 추가할 예정이다. ~~날로 먹는 프로젝트가 되어버렸다.~~

## book detail

![turnthepage-project-part-2-09](/assets/images/turnthepage-project-part-2/09.png)

책 상세 정보와 얼만큼 진도를 나갔는지 알수 있다.

![turnthepage-project-part-2-11](/assets/images/turnthepage-project-part-2/10.png)

![turnthepage-project-part-2-12](/assets/images/turnthepage-project-part-2/11.png)

반응형 사이트 구현을 위해 북 상세 페이지 영역을 col-lg-4 col-sm-5로 주고 댓글 페이지 영역은 col-lg-8 col-sm-7로 주었다.

≥992px에서는 4:8, ≥576px에서는 5:7, 그 이하로는 미디어 쿼리를 적용해서 꽉찬 화면을 유지하게 했다.

# 마치며

부트스트랩 컴포넌트를 가져다 쓰다 보니 직접 짠 css가 20줄이 안된다. 그만큼 부트스트랩이 잘만들어졌다는 거겠지. 아무튼 동기부여를 위해 만든 프로젝트라 점점 만들어 나가려고 한다. 다음 편은 AWS와 Docker를 활용해서 서버를 구성한 이야기를 해보려고한다.
