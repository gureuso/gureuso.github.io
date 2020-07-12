---
layout: post
title: "젠킨스로 CI/CD 구축하기"
date: 2020-07-12 01:00:49 +0900
author: "구르소"
thumbnail: "/assets/images/create-ci-cd-pipeline-in-jenkins/07.png"
categories: ["project"]
tags: ["jenkins", "jira", "slack", "github"]
comments: true
---

드디어 "CI/CD 구축하기"를 하게 되었다. 젠킨스를 도커에 올릴수 있다는 것 만으로도 신기한데 자동화된 테스트와 빌드를 구축할 수 있게 됐다는 사실에 흥분을 감출수 없었다. 
그럼 CI/CD를 이해하고 구축 과정을 알아보자.

## CI

지속적인 통합(Continuous Integration)을 의미하며 테스트 및 빌드를 자동화 하여 코드 품질을 지키는 것이다.

ex) 사용자가 GitHub에 코드를 푸시 하면 Jenkins가 테스트 및 빌드를 자동으로 해준다. 그리고 그 결과를 피드백 해준다.

## CD

지속적인 서비스 제공(Continuous Delivery) 또는 지속적인 배포(Continuous Deployment)를 의미한다. CI의 연장선이며 개발자의 변경 사항을 리포지토리에서 
프로덕션 환경까지 자동으로 배포하는 것을 의미한다.

ex) Jenkins에서 테스트 및 빌드가 끝나면 systemctl reload httpd.service를 통해 교체 작업을 해준다.

# 순서

- Jira와 GitHub 연동 및 워크플로우 설정
- Jenkins와 GitHub 연동
- Jenkins와 Slack 연동

## Jira와 GitHub 연동 및 워크플로우 설정

![create-ci-cd-pipeline-in-jenkins-01](/assets/images/create-ci-cd-pipeline-in-jenkins/01.png)

예전 같았으면 직접 생성을 해줬어야 했지만 지금은 GitHub 마켓에서 앱만 다운 받아도 연동이 가능하다.

![create-ci-cd-pipeline-in-jenkins-02](/assets/images/create-ci-cd-pipeline-in-jenkins/02.png)

설정이 끝났다면 Jira의 칸반보드를 열어보자. 나는 열기, 진행 중, 해결됨으로 열을 만들어봤다. 하지만 아직은 아무것도 작동 하지 않을 것이다.

![create-ci-cd-pipeline-in-jenkins-03](/assets/images/create-ci-cd-pipeline-in-jenkins/03.png)

Jira에서는 워크플로우 라는 것을 지원한다. 여기서 이슈를 어느 열에 넣을 수 있는지를 컨트롤 한다. 

![create-ci-cd-pipeline-in-jenkins-04](/assets/images/create-ci-cd-pipeline-in-jenkins/04.png)

또한 트리거를 설정하여 GitHub에서 액션 시 이슈를 원하는 열에 넣을 수 있게 된다.

## Jenkins와 GitHub 연동

![create-ci-cd-pipeline-in-jenkins-05](/assets/images/create-ci-cd-pipeline-in-jenkins/05.png)

자동으로 테스트, 빌드, 배포를 하기 위해서는 GitHub repo에서 git webhooks를 연동시켜줘야 한다.

자세한 설정은 아래 링크를 참고하자.

https://galid1.tistory.com/466

## Jenkins와 Slack 연동

![create-ci-cd-pipeline-in-jenkins-06](/assets/images/create-ci-cd-pipeline-in-jenkins/06.png)

배포 결과를 실시간으로 받기 위해서 연동을 해준다.

아래 링크를 참고하자.

https://dnight.tistory.com/entry/Jenkins-Slack-%EC%95%8C%EB%A6%BC-%EC%97%B0%EB%8F%99

# 마치며

![create-ci-cd-pipeline-in-jenkins-07](/assets/images/create-ci-cd-pipeline-in-jenkins/07.png)

유저는 Jira를 통해 이슈를 관리 할수 있으며 git 액션에 따라 이슈 상태가 자동으로 변경된다. 또한 코드 merge 시 Jenkins는 자동으로 배포를 시작한다. 그리고 그 결과를 
 Slack으로 받을 수 있다.

CI/CD 툴을 전체적으로 써볼 수 있어서 좋았고 제대로 된 개발 환경을 구축했다는 사실이 너무 뿌듯했다. 다만 워크플로우는 친구의 도움으로 해결해서 그 부분이 아쉽다고 느껴졌다. 
서버를 많이 다뤄봤다고 자부하지만 아직도 실력이 부족하다고 생각이 든다. 더 열심히 하자. 끝.

