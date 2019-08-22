---
layout: post
title: "이지웨이 프로젝트"
date: 2019-08-12 21:00:49 +0900
written_by: "구르소"
categories: ["project"]
tags: ["react", "next.js"]
comments: true
---

집을 나가기 위해서는 생각보다 많은 정보가 필요하다. 지금이 몇시 인지도 알아야 하고 혹시 비가 올수도 있으니 날씨도 알아야 한다. 또한 버스나 지하철 도착 시간도 알면 좋다.
오늘은 걱정 없이 집을 나갈 수 있게 각종 정보를 알려주는 프로젝트 EASYWAY에 대해서 소개해보려고 한다.

# 스택

원래는 express와 ejs 템플릿 언어를 활용해서 프로젝트를 진행하려고 했다. 하지만 기존 스택과 비교해서 큰 변화를 줄수 있는 부분이 없다고 생각해 react로 풀어보기로 결정했다.

- react
- next.js
- less.js

생 react를 쓰기에는 부담이 있어 react framework인 next.js를 express와 붙여서 사용했다.
부트스트랩을 안써도 될것 같아 css에 변화를 주고자 css 프리프로세서 less.js를 도입했다.

# 기능

![easyway-project-part-1-01](/assets/images/about/08.png)

전체적인 모습은 이렇다. 타이틀, 로고, 탭, 리스트, 푸터 등으로 이루어져있다. 타이틀 아래 아스팔트 이미지는 EASYWAY를 표현하고 싶어 만들어봤다.
큰 기능으로는 `수동 리프레쉬`, `자동 리프레쉬`, `상세 날씨보기` 기능 등이 있다.

```js
render() {
  return (
    <div>
      <Header title="EASYWAY"/>

      <Title/>
      <Logo/>
      <Tab handler={this.refresh.bind(this)}/>
      <List refresh={this.state.refresh}/>
      <Footer/>

      <Modal>
        <HourlyWeather refresh={this.state.refresh}/>
      </Modal>
    </div>
  );
}
```
코드 또한 UI와 최대한 일치하게 작성해봤다.

## 수동 리프레쉬

기본적으로 받아온 시간으로부터 시간이 지나 0초가 되면 자동 리프레쉬 하도록 설계되어 있지만 지하철과 버스 도착 정보는 실시간으로 바뀌기 때문에 정확하게 알고 싶을 때는 수동으로 리프레쉬 해주면 된다.

```js
<Tab handler={this.refresh.bind(this)}/>

<List refresh={this.state.refresh}/>
<Modal>
  <HourlyWeather refresh={this.state.refresh}/>
<Modal/>
```

버튼 클릭 시 부모 refresh state가 true가 되고 자식 props에 전달되어 진다.

```js
componentWillReceiveProps(nextProps: any) {
  if(nextProps.refresh == true) {
    this.setAll();
  }
}
```

이때 componentWillReceiveProps에서 체크해 액션을 취한다.

## 자동 리프레쉬

```js
class UI {
  setWaitingTime(target: JQuery<HTMLElement>, sec: number, callback: Function) {
    const interval = new Interval();
    const id = interval.set(() => {
      const minute = (sec / 60) >> 0;
      const minute_message = minute ? String(minute) + '분' : '';
      const sec_message = String(sec - (minute * 60)) + '초'
      target.text(minute_message + sec_message);
      sec -= 1;
      if(sec < 0) {
        interval.clear(id);
        callback(target);
      }
    }, 1000);
  }
}
```

공을 들여 설계한 기능이다. API를 호출해서 받아온 도착 시간을 setInterval() 함수에 넣어주고 0초가 되면 다시 호출해주는 재귀 시스템이다.

## 상세 날씨보기

![easyway-project-part-1-02](/assets/images/easyway-project-part-1/02.png)

현재 날씨를 가지고는 미래 날씨를 예측할 수 없었다. 우산을 가지고 나가려고 해도 언제 비가 그치는지 다시 내리는지 알수 없었기 때문이다.
해당 문제를 해결하기 위해 API 문서를 뒤져봤는데 다행히 3시간 간격으로 미래 날씨를 알려주는 API가 있었다.
여기까지는 아주 쉽게 풀수 있었다. 하지만 UI로 풀기 위해서는 Modal창이 필요했고 Modal 컴포넌트를 만들어야 했다.
프론트 개발자가 아닌 나는 당장 만들수 없었고 리서치를 해봤다. 개인 모달 코드를 참고하기도 했고 부트스트랩 모달 코드를 보기도 했다. 하지만 명쾌한 답을 얻을 수는 없었다.
한숨을 쉬면서 고민하던 와중 html 강의 사이트에서 Modal 강좌를 볼수 있었고 답을 얻을 수 있었다.

- 모달 화면 밖을 클릭하면 창이 닫혀야 한다.
- 모달 화면을 제외하고는 모든 화면은 검게 보여야 한다.
- 스크롤 위치와 상관없이 상단에 모달을 표시해야 한다.

```js
class Modal extends React.Component {
  static active() {
    $('.modal, .modal-dialog').show();
  }

  static deactive() {
    $('.modal, .modal-dialog').hide();
  }

  componentDidMount() {
    $('.modal-close').click(() => {
      {Modal.deactive()};
    });
    $('.modal').click(event => {
      if(event.target.className == 'modal') {
        {Modal.deactive()};
      }
    });
  }

  render() {
    return (
      <div className="modal">
        <div className="modal-dialog">
          <div className="modal-header">
            <div className="modal-close">
              <img src="/static/img/close_btn_01.svg"/>
            </div>
          </div>
          <div className="modal-content">
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}
```

active와 deactive를 static 함수로 작성하여 언제든지 모달창을 외부에서 제어 가능하게 만들었다.
componentDidMount에서는 모달창 밖을 클릭하거나 닫기 버튼을 클릭하면 창이 종료될 수 있게 만들었다.

```js
<Modal>
  <HourlyWeather refresh={this.state.refresh}/>
</Modal>
```

{this.props.children}을 활용해 Modal 속을 채웠다.

```css
.modal {
  display: none;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  position: fixed;
  overflow: auto;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none !important;
  }
}
```

.modal을 position: fixed로 주고 width와 height를 100%로 설정해 스크롤 위치와 상관없이 Modal창을 상단에 표시할 수 있게 되었다.
이중 스크롤바는 &::-webkit-scrollbar 옵션을 통해 없애줬다.

## 따라다니는 탭

![easyway-project-part-1-03](/assets/images/easyway-project-part-1/03.png)

모바일 화면 시 스크롤이 길어지면 상단 리프레쉬 버튼이 안보인다. 그래서 따라다니는 탭을 적용해 해결했다.

```js
changeTabMode() {
  const height = $('#title').height()! + $('#logo').height()! + ($('.tab').height()!);
  $(window).scroll(() => {
    const windowHeight = $(document).scrollTop();
    if(windowHeight! > height) {
      $('.tab').removeClass('tab').addClass('mini-tab');
      $('#list').css({'margin-top': '325px'});
    } else {
      $('.mini-tab').removeClass('mini-tab').addClass('tab');
      $('#list').css({'margin-top': '-50px'});
    }
  });
}
```

height를 계산해 적용해줬다.

# 마치며

공공 데이터를 활용해 프로젝트를 진행해봤다. API에 대해서는 몇가지 아쉬운 점들이 있었지만 내가 원하는 사이트를 만들기에는 부족함이 없어 어느정도 만족한다.
개인이 얻기 힘든 데이터가 공공 데이터로 나와 있어 이것을 가지고 작은 힘으로 큰 결과물을 만들 수 있어서 그 점이 너무 좋았다. 사이트도 디자인을 참고해서 만들었지만 깔끔하게 나와서 좋았다.
걱정 없이 집을 나갈 수 있게 각종 정보를 알려주는 프로젝트 EASYWAY 최근 진행했던 프로젝트 중에서는 가장 알맹이가 있는 프로젝트가 아니였을까 싶다.
실제로 집을 나갈 때 사용하기도 할꺼고 발전 가능성도 큰 프로젝트이다. 기회가 된다면 더 개발해 나만 사용하는 사이트가 아닌 모두가 사용 가능한 사이트로 만들어보고 싶은 욕심이 생겼던 프로젝트이다. 하지만 아직은 나만 사용할꺼기 때문에 여기까지 진행할것이다. 끝!
