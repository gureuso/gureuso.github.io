---
layout: post
title: "SELECT 한 데이터 동시에 INSERT 하기"
date: 2017-01-05 16:30:30 +0900
written_by: "구르소"
description: "select 한 데이터 정보가 다르면 반복문을 통해 여러번 insert 쿼리를 날려 저장했습니다. 낭비였지만 마땅한 방법이 없어 고민하던 중 해결 방법을 찾게되어 공유합니다."
categories: ["database"]
tags: ["mysql"]
comments: true
---

select 한 데이터 정보가 다르면 반복문을 통해 insert 쿼리를 여러번 실행해 저장했습니다. 낭비였지만 마땅한 방법이 없어 고민하던 중 해결 방법을 찾게되어 공유합니다.

```sql
INSERT INTO table_2 (column_name(s)) SELECT column_name(s) FROM table_1
```

이 쿼리문을 몰라 데이터 행 개수마다 반복문을 돌렸다니.. 더 빡시게 공부해야겠다.