---
layout: post
title: "Decoupling and Cohesion in software architecture"
date: 2017-04-16 15:10:30 +0900
written_by: "구르소"
categories: ["programming"]
tags: ["decoupling", "cohesion"]
comments: true
---

사수께서 decoupling과 cohesion을 아냐고 질문하셨을 때 대답할 수 없었다. 그래서 오늘은 내가 이해하려고 했던 decoupling and cohesion in software architecture에 대해 글을 쓰려고 한다.

## coupling

두 자식 클래스(A, B)가 같은 부모 클래스(C)를 상속받는 경우 한 클래스(A)의 변경은 다른 클래스(B)를 변경시킨다. 이런 경우가 coupling이 있는 경우다. coupling이 강할수록 작은 변경에도 코드 전부를 바꾸게 된다. 이것을 나쁜 코드라 말한다. 즉 coupling이 약한 코드는 유지, 보수가 더 쉬운 좋은 코드이다.

## cohesion

클래스에 하나의 문제 해결을 위한 코드를 모아 놓음으로써 높은 cohesion을 가지는 것이 코드의 품질을 높일 수 있다. 즉 높은 cohesion을 가지는 코드는 유지, 보수가 더 쉬운 좋은 코드이다.

## 결론

> 소프트웨어 공학의 관점에서 볼 때 S/W의 질을 향상하기 위해 강한 응집력(Strong Cohesion)과 약한 결합력(Weak Coupling)을 지향해야 하는데, OOP의 경우 클래스에 하나의 문제 해결을 위한 데이터를 모아 놓은 데이터형을 사용함으로써 응집력을 강화하고, 클래스간에 독립적으로 디자인함으로써 결합력을 약하게 할 수 있다.

## 참고

- [위키백과 객체 지향 프로그래밍](https://ko.wikipedia.org/wiki/%EA%B0%9D%EC%B2%B4_%EC%A7%80%ED%96%A5_%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D)
- [스택오버플로우](http://stackoverflow.com/questions/2881586/cohesion-and-decoupling)


