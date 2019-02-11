---
layout: post
title: "페이스북 댓글 파싱하기"
date: 2017-07-20 02:30:30 +0900
written_by: "구르소"
categories: ["programming"]
tags: ["python", "facebook", "parsing"]
comments: true
---

배달의 민족에서 치킨천마리 이벤트를 진행했다. 댓글에 학교명을 입력해 가장 많이 참여한 학생들의 학교에 치킨을 제공하는 거였다. 참여를 부탁하는 글을 보고 참여를 
했는데 누군가 파싱 사이트를 만들어 놨었다. 파싱을 종종 했었지만 페이스북 댓글은 해본적이 없어 만들면서 삽질한 이야기를 해보려고 한다.

![parsing-facebook-comments-01](/assets/images/parsing-facebook-comments/01.jpg)

참여 기준은 다음과 같고 어떤 기준으로 코드를 작성할지 생각해봤다.

* 가장 많은 댓글 참여가 일어난 학교가 치킨을 받습니다!
* 한 사람당 한 번 참여 가능합니다
* '지역' 과 '학교명' 이 댓글 내 포함되어 있으면 모두 확인 예정입니다.
* 대댓글도 모두 확인 예정입니다.

답변에 대한 방식은 다음과 같이 정했고, 코드를 작성하면서 생각하기로 했다.

* {"학교명": 참여횟수}로 저장 후 정렬
* {"id": "name"}로 저장해서 .get으로 중복 체크
* ", 학교명" or "지역, 학교명" or "(지역 and 학교명 검색)" 3가지 중 선택
* 대댓글 API가 있는지 확인


# 댓글 가져오기

처음에는 페이지에서 직접 가져오려고 했지만 너무 파싱하기 어려워 API가 있는지 찾아보게 되었다. 다행히 
[facebook comments](https://developers.facebook.com/docs/graph-api/reference/v2.10/object/comments){:target="_blank"} 
API가 있었다.

> GET /v2.10/{object-id}/comments HTTP/1.1
>
> Host: graph.facebook.com

```json
{
  "data": [{
    "created_time": "2017-07-06T13:13:14+0000",
    "from": {
      "name": "이름",
      "id": "1878163959172881"
    },
    "message": "✔부산, 남천중학교",
    "id": "1474971405859499_1885513398437150"
  }],
  "paging": {
    "cursors": {
      "before": "NDE4OTMZD",
      "after": "NDE4NjkZD"
    },
    "next": "https://graph.facebook.com/v2.10/1474971405859499/comments?access_token=Mj0foN959KWhvrq285fuqOMTPU&pretty=0&limit=25&after=NDE4NjkZD"
  }
}
```

data 루프를 돌면서 comment를 가져와 파싱하고 루프가 끝나면 next url로 이동, next key가 없을 때 까지 파싱하면 된다고 생각했다.

# 참여조건 정하기

문제는 message였다. 참여 조건을 만족하려면 지역명과 학교명이 필요했는데 `서울, ㅇㅇ고등학교`, `서울특별시, ㅇㅇ고등학교`처럼 지역명이 다양하게 
사용되고 있었다. 결국 다른 사이트에서 파싱한 방법과 동일한 `, 학교명`을 기준으로 파싱하게 되었다.

![parsing-facebook-comments-01](/assets/images/parsing-facebook-comments/02.jpg){:width="600px"}

학교명 리스트는 [학교 알리미](http://www.schoolinfo.go.kr/ng/pnnggo_a01_l0.do){:target="_blank"} 공개용 데이터 카테고리에서 엑셀로 얻을 수 있었다.

```
class School(object):
    @classmethod
    def getSchoolNames(cls):
        schoolNames = []
        path = os.path.dirname(os.path.abspath(__file__)) + "/schools.xlsx"
        book = xlrd.open_workbook(path)
        sheet = book.sheet_by_index(0)
        for rowx in range(1, sheet.nrows):
            schoolName = sheet.cell_value(rowx=rowx, colx=4)
            schoolNames.append(schoolName)
        return schoolNames
```

학교명만 필요하기 때문에 colx=4로 고정해서 array로 리턴했다.

```python
for schoolName in self.schoolNames:
    if ", " + schoolName in message:
        self.setSchool(schoolName)
        self.setAlreadyVoteUserId(userId)
        self.setAlreadyCheckCommentId(commentId)
        self.setSchools()
```

array로 리턴받은 값은 생성자를 통해 초기화 했고 다음과 같이 비교했다. 원래는 정규식으로 하려고 했는데 in 구문이 훨씬 빨라 저렇게 작성했다.

# 중복참여 체크하기

```json
{
  "result": {"schoolName": 0},
  "alreadyVoteUserIds": {"userId": 0},
  "alreadyCheckCommentIds": {"CommentId": 0}
}
```

"result"에는 결과 값을, "alreadyVoteUserIds"에는 참여한 userId를, "alreadyCheckCommentIds"에는 검사한 commentId를 저장하도록 해서 
도중에 중단되어도 다시 검사할 수 있도록 작성했다.

```python
if self.alreadyVoteUserIds.get(userId):
    return
if self.alreadyCheckCommentIds.get(commentId):
    return
```

이미 참여한 유저 혹은 체크한 댓글에 대해서는 함수가 종료되도록 작성했다.

# 대댓글 체크하기

> GET /v2.10/{object-id}/comments?fields=comments{id,from,message,comments} HTTP/1.1
>
> Host: graph.facebook.com

```json
{
  "data": [{
    "id": "1474971405859499_317110135399599",
    "from": {
      "name": "name",
      "id": "168955389794447"
    },
    "message": "",
    "comments": [{
      "data": [{
        "id": "1474971405859499_495443297467218",
        "from": {
          "name": "김태윤",
          "id": "287822654960621"
        },
        "message": "초등학교"
      }]
    }]
  }]
}
```

replies를 가져와야 하는데 comments API에서는 마땅한 정보를 얻을 수 없었다. 열심히 구글링을 하다 다행히 fields에 comments 값을 주면 replies를 
얻을 수 있다는 것을 알게 되었고 params를 수정했다.

```python
for data in res["data"]:
    self.setData(data)
    comments = data.get("comments")
    if comments:
        for comment in comments["data"]:
            self.setData(comment)
```

이중 포문을 사용해 대댓글도 검사하게 했다.

# 버그가 있다?

> For objects that have tens of thousands of comments, you may encounter limits while paging. The API will return an error when your app has reached the cursor limit:
>
> { "error": { "message": "(#100) The After Cursor specified exeeds the max limit supported by this endpoint", "type": "OAuthException", "code": 100 } }

수 만건의 댓글에서는 cursor에 이상이 생겨 error를 리턴한다는건데 이것도 모르고 계속 삽질하느라 힘들었었다. API에서 error를 리턴하는거라 마땅한 해결법은 
찾지 못해 여기서 마무리 지었다.

# 결과

* 해성국제컨벤션고등학교: 180
* 경기국제통상고등학교: 155
* 선린인터넷고등학교: 130
* 미림여자정보과학고등학교: 109
* 대구여자상업고등학교: 102
* 세종과학예술영재학교: 100
* 마산여자고등학교: 89
* 영신중학교: 69
* 성남여자고등학교: 64
* 대전여자상업고등학교: 56

처음에는 API 에러 때문에 모든 댓글을 체크하지 못해 숫자가 적은줄 알았는데 양식을 지키지 않고 참여하는 사용자가 많아 파싱이 제대로 되지 않았다. 
그래서 `, 학교명`에서 `(지역 and 학교명)`이 포함되어 있으면 파싱하도록 변경했다.

```python
class People(object):
    @classmethod
    def getCities(cls):
        cities = [u"경남", u"경북", u"전남", u"전북", u"충남", u"충북"]

        def push(data):
            if data is None:
                return
            if data in cities:
                return
            cities.append(data)

        path = os.path.dirname(os.path.abspath(__file__)) + "/people.xls"
        book = xlrd.open_workbook(path)
        sheet = book.sheet_by_index(0)
        for rowx in range(3, sheet.nrows):
            data = sheet.cell_value(rowx=rowx, colx=0)

            firstData = re.sub("\s+\(\d+\)", "", data)
            push(firstData)

            arr = firstData.split(" ")
            if len(arr) == 1:
                secondData = re.sub(ur"(특별시|광역시|특별자치시|특별자치도|도)", "", arr[0])
            elif len(arr) == 2:
                secondData = arr[1][:-1] if len(arr[1]) > 2 else arr[1]
            else:
                secondData = None
            push(secondData)
        return cities
```

지역같은 경우에는 줄임말이 많아 그에 맞게 변환해서 array를 만드느라 시간이 많이 들었다. 
지역 리스트는 [주민등록 인구통계](http://rcps.egov.go.kr:8081/jsp/stat/ppl_stat_jf.jsp){:target="_blank"} 엑셀로 얻을 수 있었다.
 
```python
for schoolName in self.schoolNames:
    if schoolName in message:
        for city in self.cities:
            message = message.replace(schoolName, "")
            if city in message:
                self.setSchool(schoolName)
                self.setAlreadyVoteUserId(userId)
                self.setAlreadyCheckCommentId(commentId)
                self.setSchools()
```

속도를 고려해 학교명이 있는 message부터 체크하고, 학교명이 있으면 학교명을 제거한 message에서 다시 지역을 체크하게 했다.

* 경기국제통상고등학교: 773
* 경화여자중학교: 636
* 해성국제컨벤션고등학교: 319
* 궁내중학교: 291
* 동화고등학교: 279
* 대구여자상업고등학교: 260
* 광명고등학교: 204
* 서울삼육중학교: 200
* 대일관광고등학교: 192
* 효자중학교: 185

총 61408개의 댓글을 체크했고 TOP 10을 출력했다. 
이번에도 역시 'message': u'(#100) The After Cursor specified exceeds the max limit supported by this endpoint' 에러가 발생해 
모든 댓글을 체크하지는 못했지만 수치가 많이 개선된 모습을 볼수 있었다. 
배민 데이터를 봐야겠지만 데이터상 `경기국제통상고등학교` 또는 `경화여자중학교`가 당첨될꺼 같다.

# 전체코드

```python
# -*- coding: utf-8 -*-
import json
import os
import operator
import requests
import re
import xlrd


class People(object):
    @classmethod
    def getCities(cls):
        cities = [u"경남", u"경북", u"전남", u"전북", u"충남", u"충북"]

        def push(data):
            if data is None:
                return
            if data in cities:
                return
            cities.append(data)

        path = os.path.dirname(os.path.abspath(__file__)) + "/people.xls"
        book = xlrd.open_workbook(path)
        sheet = book.sheet_by_index(0)
        for rowx in range(3, sheet.nrows):
            data = sheet.cell_value(rowx=rowx, colx=0)

            firstData = re.sub("\s+\(\d+\)", "", data)
            push(firstData)

            arr = firstData.split(" ")
            if len(arr) == 1:
                secondData = re.sub(ur"(특별시|광역시|특별자치시|특별자치도|도)", "", arr[0])
            elif len(arr) == 2:
                secondData = arr[1][:-1] if len(arr[1]) > 2 else arr[1]
            else:
                secondData = None
            push(secondData)
        return cities


class School(object):
    @classmethod
    def getSchoolNames(cls):
        schoolNames = []
        path = os.path.dirname(os.path.abspath(__file__)) + "/schools.xlsx"
        book = xlrd.open_workbook(path)
        sheet = book.sheet_by_index(0)
        for rowx in range(1, sheet.nrows):
            schoolName = sheet.cell_value(rowx=rowx, colx=4)
            schoolNames.append(schoolName)
        return schoolNames

    @classmethod
    def getSchools(cls):
        """
        {
          "result": {"schoolName": 0},
          "alreadyVoteUserIds": {"userId": 0},
          "alreadyCheckCommentIds": {"CommentId": 0},
        }
        """
        path = os.path.dirname(os.path.abspath(__file__)) + "/schools.json"
        try:
            with open(path, 'r') as f:
                data = json.load(f)
        except IOError:
            open(path, 'w')
            data = {"result": {}, "alreadyVoteUserIds": {}, "alreadyCheckCommentIds": {}}
        return data

    @classmethod
    def setSchools(cls, data):
        path = os.path.dirname(os.path.abspath(__file__)) + "/schools.json"
        with open(path, 'w') as fileData:
            json.dump(data, fileData, indent=2)


class CommentParser(object):
    def __init__(self, objectId):
        self.accessToken = os.getenv("ACCESS_TOKEN", "ACCESS_TOKEN")
        self.objectId = objectId
        self.schoolNames = School.getSchoolNames()
        self.cities = People.getCities()

        schools = School.getSchools()
        self.result = schools["result"]
        self.alreadyVoteUserIds = schools["alreadyVoteUserIds"]
        self.alreadyCheckCommentIds = schools["alreadyCheckCommentIds"]

    def perform(self):
        count = 0
        nextUrl = None
        beforeData = None
        while True:
            res = self.getData(nextUrl)
            if res.get("error"):
                print beforeData
                print res
                print nextUrl
                break

            for data in res["data"]:
                count += 1
                print "count: {0}".format(count)
                self.setData(data)
                comments = data.get("comments")
                if comments:
                    for comment in comments["data"]:
                        count += 1
                        print "count: {0}".format(count)
                        self.setData(comment)

            beforeData = res
            nextUrl = res["paging"].get("next")
            if not nextUrl:
                break

        schools = sorted(self.result.items(), key=operator.itemgetter(1), reverse=True)
        for school in schools:
            print "{}: {}".format(school[0].encode("utf-8"), school[1])

    def getData(self, nextUrl=None):
        params = {
            "access_token": self.accessToken,
            "limit": 100,
            "fields": "id,from,message,comments{id,from,message,comments}"
        }
        url = nextUrl or "https://graph.facebook.com/v2.9/{0}/comments".format(self.objectId)
        res = requests.get(url, params)
        return json.loads(res.content)

    def setData(self, data):
        commentId = data["id"]
        message = data["message"]
        userId = data["from"]["id"]

        if self.alreadyVoteUserIds.get(userId):
            return
        if self.alreadyCheckCommentIds.get(commentId):
            return

        for schoolName in self.schoolNames:
            if schoolName in message:
                for city in self.cities:
                    message = message.replace(schoolName, "")
                    if city in message:
                        self.setSchool(schoolName)
                        self.setAlreadyVoteUserId(userId)
                        self.setAlreadyCheckCommentId(commentId)
                        self.setSchools()

    def setAlreadyVoteUserId(self, userId):
        count = self.alreadyVoteUserIds.get(userId, 0)
        count += 1
        self.alreadyVoteUserIds[userId] = count

    def setAlreadyCheckCommentId(self, commentId):
        count = self.alreadyCheckCommentIds.get(commentId, 0)
        count += 1
        self.alreadyCheckCommentIds[commentId] = count

    def setSchool(self, schoolName):
        school = self.result.get(schoolName)
        count = 1 if not school else school + 1
        self.result[schoolName] = count

    def setSchools(self):
        data = {
            "result": self.result,
            "alreadyVoteUserIds": self.alreadyVoteUserIds,
            "alreadyCheckCommentIds": self.alreadyCheckCommentIds
        }
        School.setSchools(data)

parser = CommentParser("1474971405859499")
parser.perform()
```
