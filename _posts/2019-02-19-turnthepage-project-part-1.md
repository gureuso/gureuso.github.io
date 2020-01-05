---
layout: post
title: "턴더페 프로젝트 part 1"
date: 2019-02-19 19:53:30 +0900
author: "구르소"
thumbnail: "/assets/images/turnthepage-project-part-1/01.png"
categories: ["project"]
tags: ["django"]
comments: true
---

"동기부여를 위해서 목표 설정이 가능한 책 저장소를 만들자"라는 생각을 가지고 턴더페 프로젝트를 하게 됐다. 마침 장고도 알게 되어서 배운거 써먹자는 생각도 한몫 했다.

턴더페는 turn the page의 준말로 페이지를 넘길 수 있게 도와준다는 의미를 가진 프로젝트이다.

# 스택

back-end:
- Django

front-end:
- Jquery
- Bootstrap4

database:
- MySQL

server:
- Docker
- AWS ELB
- AWS S3

# 장고

뼈대가 이미 만들어져 있고 조립만 하면 되는 느낌을 받았다. 특히 폼 자동생성과 클래스형 뷰는 정말 편리했다.

플라스크는 블루프린트 덕분에 작게 쪼갤 수 있는 부분이 많았는데 함수형 뷰를 쪼개기는 한계가 있었다. 찾아보니 플라스크도 클래스형 뷰를 지원하긴 하지만 구색만 갖춘 느낌이다.

어쨌든 앞서 말한 장점들 때문에 프로젝트를 한결 수월하게 만들었고 클래스형 뷰를 알게 되어서 장고를 배우길 잘했다는 생각을 가지게 되었다.

## 구조

![turnthepage-project-part-1-01](/assets/images/turnthepage-project-part-1/01.png)

장고는 프로젝트와 앱 기반으로 이루어져 있다. 플라스크에서는 마이그레이션을 한 폴더에서 해결 했는데 여기서는 앱 마다 마이그레이션 파일을 가지고 있어서 특이했다.
형상 관리만 지원해서 그렇게 만든것 같다.

만든 앱은 `accounts`, `books`, `errors`, `main`으로 계정관리, 북관리, 에러 리다이렉션, 기타 사용을 위해서 만들었다.

## accounts(계정관리)

accounts 앱에는 회원가입, 로그인, 로그아웃 기능이 들어가 있다.

```python
app_name = 'accounts'
urlpatterns = [
    path('login', auth_views.LoginView.as_view(redirect_authenticated_user=True), name='login'),
    path('logout', auth_views.LogoutView.as_view(), name='logout'),
    path('signup', views.SignupView.as_view(), name='signup'),
]
```

장고에서는 auth view를 통해 별도의 로직없이 장고 유저 시스템을 사용할 수 있다. 장고 어드민에서 사용하는 유저랑 같은 DB를 사용한다는 것이다.

장고 유저 시스템은 `username`으로만 ID를 사용할 수 있는데 요즘 사이트들은 `username` 또는 `email`로 로그인 가능하게 만들어져 있다. 
이런거 따라하기 좋아해서 커스텀 가능한지 구글링 해봤다.

```python
# Auth
AUTHENTICATION_BACKENDS = [
    'turnthepage.backends.AuthBackend',
]
AUTH_USER_MODEL = 'accounts.User'
```

ModelBackend를 상속해서 인증로직을 직접 만들 수 있다는 사실을 알게 되었다. settings.py에 AUTHENTICATION_BACKENDS를 추가하고 backend 로직을 작성했다.

```python
class AuthBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        pass
```

```python
class MyUserManager(UserManager):
    def create_user(self, username=None, email=None, password=None, **extra_fields):
        pass

class User(AbstractUser):
    email = models.EmailField(
        verbose_name='email address',
        max_length=255,
        unique=True,
    )

    objects = MyUserManager()
```

AuthBackend class에서는 `username` 또는 `email`로 로그인 가능하게 로직을 작성했고 UserModel class에서는 기존 유저 시스템에 email만 변경했다.

## books(북관리)

기능이 몇개 없긴 하지만 핵심 기능이 들어있다. ~~프로젝트 닉값에 비해 기능이 부실하긴 하다. 나중에 프로젝트 하게되면 기능 추가해서 재탕해야겠다.~~

```python
app_name = 'books'
urlpatterns = [
    path('', views.BookListView.as_view(), name='book_list'),
    path('<int:pk>', views.BookDetailView.as_view(), name='book_detail'),
    path('<int:pk>/create', views.PageCreateView.as_view(), name='page_create'),
    path('create', views.BookCreateView.as_view(), name='book_create'),
]
```

> /books - 책을 추가하게 되면 여기서 리스트를 볼수 있다.
>
> /books/\<int:pk> - 책 진도를 어디까지 나갔는지 볼수 있다.
>
> /books/\<int:pk>/create - 책 진도를 뺄수 있게 해주는 API이다.
>
> /books/create 책 추가 API이다.

class based view를 활용해서 적절하게 코딩했다.

책 생성시 파일 업로드 시스템을 로컬에서 구현 했는데 도커를 사용하면서 media가 계속 초기화 되어 버렸다. 결국 서버를 만들기로 했고 AWS S3를 활용해서 만들게 되었다.

```python
# Django Storages
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto.S3BotoStorage'

AWS_LOCATION = 'static/media'
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME', 'turnthepage')
AWS_REGION = 'ap-northeast-2'
AWS_S3_HOST = 's3.{0}.amazonaws.com'.format(AWS_REGION)
AWS_S3_CUSTOM_DOMAIN = '{0}/{1}'.format(AWS_S3_HOST, AWS_STORAGE_BUCKET_NAME)
```

![turnthepage-project-part-1-02](/assets/images/turnthepage-project-part-1/02.png)

boto와 django-storages 모듈을 활용해서 구현했다. 이 모듈이 정말 사기인게 기존 파일 업로드 시스템 로직 수정없이 활용 가능하다는 거다. 플라스크 때 직접 구현한 기억이 있어 삽질 좀 하겠는데 싶었는데 코드 수정 없이 변수 설정 만으로 시스템 구축을 해버렸다. 진짜 씹사기다.

## errors(에러 리다이렉션)

```python
handler400 = 'errors.views.bad_request'
handler403 = 'errors.views.permission_denied'
handler404 = 'errors.views.page_not_found'
handler500 = 'errors.views.server_error'
```

프로덕트로 배포될때 에러 페이지가 있어야 할꺼 같아서 custom error page를 만들어봤다.

```python
def bad_request(request, exception):
    return render(request, 'errors/400.html', status=400)


def permission_denied(request, exception):
    return render(request, 'errors/403.html', status=403)


def page_not_found(request, exception):
    return render(request, 'errors/404.html', status=404)


def server_error(request):
    return render(request, 'errors/500.html', status=500)
```

exception을 안넣었다고 404 페이지가 500 페이지로 둔갑해버려서 해결하는데 오래걸렸다. 아직도 이해가 잘안된다.

# 마치며

이번 포스트에서는 백엔드 위주로 설명을 했는데 part 2에서는 프론트 위주로 만든거에 대해 설명하려고 한다.
