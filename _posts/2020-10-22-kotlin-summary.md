---
layout: post
title: "코틀린 기본 문법 10분 요약"
date: 2020-10-22 18:00:49 +0900
author: "구르소"
thumbnail: "/assets/images/kotlin-summary/01.png"
categories: ["programming"]
tags: ["java", "kotlin"]
comments: true
---

![kotlin-summary-01](/assets/images/kotlin-summary/01.png)

코틀린 10분 요약을 통해서 문법을 이해해보자.

## 1. 변수

var: 변할 수 있는 변수

```kotlin
var a: Int = 1
a = 2
```

val: 변하지 않는 변수

```kotlin
val a: Int = 1
a = 2 // error
```

## 2. null

```kotlin
var a: String? = null
var b: String = "1"
```

?를 붙이지 않으면 null이 올수 없다.

## 3. 함수

fun 키워드로 함수 정의

```kotlin
fun main(args: Array<String>) {
    println("Hello World!!!")
}
```

void는 생략가능.

```kotlin
fun main(args: Array<String>) = println("Hello World!")
```

한 줄로 끝날 경우 요약 가능.

## 4. 주석

```kotlin
// 한 줄 주석
/* 여러줄 주석 */
```

## 5. 문자열 템플릿

```kotlin
fun main(args: Array<String>) {
    val person = Person("alex", 14, false)
    println("${person.name} ${person.age}")
}
```

```kotlin
fun main(args: Array<String>) {
    val name = "alex"
    println("$name")
}
```

## 6. 조건문

```kotlin
fun maxOf(a: Int, b: Int): Int {
    if (a > b) {
        return a
    } else {
        return b
    }
}
```

```kotlin
fun maxOf(a: Int, b: Int): Int = if(a>b) a else b
```

요약 가능.

## 7. while, when, for

while

```kotlin
var cnt = 0
while(cnt < 10) {
    println(cnt)
    cnt++
}
```

when + enum

```kotlin
enum class Years(val years: Int) {
    ZERO(0),
    TEN(10),
    TWENTY(20),
    THIRTY(30),
    FORTY(40),
    FIFTY(50),
    SIXTY(60),
    SEVENTY(70),
    EIGHTY(80),
    NINETY(90);
}

class Person(var name: String, var age: Int, var isMarried: Boolean) {
    fun getYears(years: Years): Int {
        return when(years) {
            Years.ZERO -> Years.ZERO.years
            Years.TEN -> Years.TEN.years
            Years.TWENTY -> Years.TWENTY.years
            Years.THIRTY -> Years.THIRTY.years
            Years.FORTY -> Years.FORTY.years
            Years.FIFTY -> Years.FIFTY.years
            Years.SIXTY -> Years.SIXTY.years
            Years.SEVENTY -> Years.SEVENTY.years
            Years.EIGHTY -> Years.EIGHTY.years
            Years.NINETY -> Years.NINETY.years
        }
    }
}
fun main(args: Array<String>) {
    val person = Person("alex", 14, false)
    println(person.getYears(Years.TEN))
}
```

for

```kotlin
for(x in 0..9) {
    print(x)
}
```

## 8. class, interface

```kotlin
interface Clickable {
    fun click() = println("click")
}

open class Button: Clickable {
    override fun click() = println("override click")
}

class RadioButton: Button() {
    override fun click() {
        println("RadioButton click")
    }
}

fun main(args: Array<String>) {
    val btn = RadioButton()
    btn.click()
}
```

Button 클래스에 override는 오버라이드가 가능한 변경자이다.
원래라면 open을 붙여야 사용 가능해진다. 막고 싶으면 final을 명시하면 된다.

| 변경자 | 의미 |
|---|---|
| final | 오버라이드할 수 없음(기본값) |
| open | 오버라이드할 수 있음 |
| abstact | 반드시 오버라이드해야 함 |
| override | 상위 클래스나 상위 인스턴스의 멤버를 오버라이드하는 중 |

## 9. 생성자
```kotlin
class RadioButton: Button {
    init {
        println("11111")
    }
    constructor(title: String) {
        println(title)
    }
    constructor(title: String, text: String) {
        println("$title $text")
    }
    override fun click() {
        println("RadioButton click")
    }
}

fun main(args: Array<String>) {
    val btn = RadioButton("22222", "333333")
    btn.click()
}
```

result:


11111

22222 333333

init와 constructor는 중복사용이 가능하고 init가 먼저 실행된다.

## 10. 접근 제한자

| 접근 제한자 | 의미 |
|---|---|
| public | 기본 값으로 누구나 접근 가능 |
| private | 클래스 내부에서만 접근 가능 |
| protected | 클래스 자신과 상속받은 클래스에서 접근 가능 |
| internal | 프로젝트의 모듈 안에서 누구나 접근이 가능 |

```kotlin
open class MM {
    var a: String = "a"
    private var b: String = "b"
    protected var c: String = "c"
    internal var d: String = "d"
}

fun main(args: Array<String>) {
    var mm = MM()
    print(mm.a)
    print(mm.b)
    print(mm.c)
    print(mm.d)
}
```

a, d만 실행되고 b, c는 실행되지 않습니다.

a: public 가능

b: private 내부에서만 가능

c: 상속받아야지 가능

d: 같은 모듈이라 가능

-끝-
