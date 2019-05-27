---
layout: post
title: "사진 공유 SNS 서버 개발하기 part 2"
date: 2017-02-19 22:30:30 +0900
written_by: "구르소"
categories: ["project"]
tags: ["aws", "sns", "api"]
comments: true
---

저번시간에는 기본 스택 구성과 프레임워크 세팅까지 설명했다. 오늘은 이번 프로젝트의 핵심인 "AWS로 인프라 구축하기"에 대해 써보려고 한다.

## 목표

- 유로 게시물 보안 시스템

평소 같았으면 로직에서 모두 처리 했겠지만 프로젝트 기간도 짧고, 유로 게시물에 대한 접근 제어 프로세스를 만들자니 배보다 배꼽이 더 큰 상황이 되어 버렸다. 그래서 하던 일을 중단하고 해당 목표를 달성해줄 수 있는 플랫폼을 찾기 시작했다. 역시나 전지전능한 AWS는 답을 가지고 있었다.

## SignedURL

> 서명된 URL에는 만료 날짜 및 시간 같은 추가 정보가 포함되므로 콘텐츠에 대한 액세스를 보다 세부적으로 제어할 수 있습니다. 이러한 추가 정보는 미리 준비된(canned) 정책 또는 사용자 지정 정책에 따라 정책 설명에 나타납니다.

쉽게 말해 SignedURL은 CloudFront에서 배포되는 파일의 접근 제어를 가능하게 해주는 녀석이다. 미리 정의된 URL을 사용해 다운 가능시간, IP 제어가 가능하다.

```py
@_bucket_check
def generate_presigned_url_(self, Key=None, ExpiresIn=0):
    """ client를 이용해서 signed url을 생성 """
    Params = dict(Bucket=self.bucket_name, Key=Key)
    return self.client.generate_presigned_url(
        ClientMethod='get_object', Params=Params, ExpiresIn=ExpiresIn, HttpMethod='GET'
    )
```

signed_url:

https://s3.ap-northeast-2.amazonaws.com/name/private/2016/06/09/140910770588e7825eb771b1d73ed80e152d_20160119_123551.jpeg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=10&X-Amz-Credential=AKIAIK3YNFDYX7HZ2U7Q%2F20160609%2Fap-northeast-2%2Fs3%2Faws4_request&X-Amz-SignedHeaders=host&X-Amz-Date=20160609T094138Z&X-Amz-Signature=079a0e1fd77ddd8148e148f3f2b1f7c4cfc259132adef23cda28ac70ee8ade04

origin:

https://s3.ap-northeast-2.amazonaws.com/name/private/2016/06/09/140910770588e7825eb771b1d73ed80e152d_20160119_123551.jpeg

굿~인 줄 알았는데 s3가 아니라 cloudfront로 연결을 했어야만 했다.

```py
def generate_presigned_url(self, url, expire_sec):
    expire_date = datetime.utcnow() + timedelta(seconds=expire_sec)
    return self.CloudFrontSigner.generate_presigned_url(url, date_less_than=expire_date)
```

그래서 document를 보고 샘플 코드를 만들었는데 이상하게 작동을 하지 않는다. 어쩌다보니 open ssl 500 error가 계속 출력 된다. 답이 없다고 판단하여 자체 생성을 하기로 결정하였다. ~~공식문서 소스가 작동을 안해..~~

```py
class CloudFront:
    # https://docs.aws.amazon.com/ko_kr/AmazonCloudFront/latest/DeveloperGuide/private-content-trusted-signers.html#private-content-creating-cloudfront-key-pairs
    # open ssl 500 error가 나서 사용 불가능으로 판단해서 서버에서 직접 생성으로 변경
    def __init__(self):
        self.key_id = 'key_id'  # TODO 나중에는 .json 형식으로 따로 관리하자.
        self.key_file = os.path.dirname(os.path.abspath(__file__)) + '/pk-key_file.pem'
        self.CloudFrontSigner = CloudFrontSigner(self.key_id, self.rsa_signer)

    @staticmethod
    def rsa_signer(message):
        with open(key_file, 'rb') as f:
            private_key = serialization.load_pem_private_key(
                f.read(),
                password=None,
                backend=default_backend()
            )
        signer = private_key.signer(padding.PKCS1v15(), hashes.SHA1())
        signer.update(message)
        return signer.finalize()

    def generate_presigned_url_(self, url, expire_sec, client_id):
        expire_sec += int(time.time())
        recipe = {
            'Statement': [{
                'Resource': url,
                'Condition': {'DateLessThan': {'AWS:EpochTime': expire_sec}}
            }]
        }
        recipe = ((json.dumps(recipe).rstrip('\r\n')).replace(' ', '')).rstrip(os.linesep)
        path = '/var/tmp/bridgefan/' + client_id
        with open(path, 'w') as f:
            f.write(recipe)
        signature = cmd(
            'cat {0} | openssl sha1 -sign {1} | openssl base64 | tr "+=/" "-_~"'.format(path, self.key_file)
        )
        os.remove(path)
        url = '{0}?Expires={1}&Signature={2}&Key-Pair-Id={3}'.format(url, expire_sec, signature, self.key_id)
        return ((url.rstrip('\r\n')).replace(' ', '')).replace('\n', '')
```

file open을 피하고 싶었지만 이렇게 하지 않으면 이상하게 제대로 된 signed_url이 나오지 않았다. ~~수명깍이는 소리좀 안나게 해라~~

## 인프라 구성

![implement-sns-server-for-sharing-photo-part-2-01](/assets/images/implement-sns-server-for-sharing-photo-part-2/01.jpg){:width="500px"}

뭐 우여곡절 끝에 다음과 같은 인프라를 구성할 수 있었다. 로드밸런싱은 ELB를 사용해 부하 분산을 구현했고, MongoDB는 ReplicaSet을 설정해 부하 분산을 구현했다.

S3는 CloudFront를 사용해 반응성을 높혔고, Edge Location을 사용해 모든 리전에서 제공할 수 있게 만들었다.