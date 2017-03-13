---
layout: home
title: Схемотехника
---
{% assign first = true %}
{% for post in site.posts %}
{% if first %}{% unless post.future %}
{% if post.image %}
![](logos/{{ post.image }})
{% else %}
#{% if post.ctitle %}{{ post.ctitle }}{% else %}Схемотехника {{ post.number }}{% endif %}</h1>
{% endif %}
{{ post.content }}
{% assign first = false %}
{% endunless %}{% endif %}
{% endfor %}

## Все встречи

{% for post in site.posts %}
* {{ post.evdate }}: [Схемотехника {{ post.number }}]({{ post.url }})
{% endfor %}

## Что это?

«Схемотехника» — главная и единственная серия встреч ГИС-энтузиастов из
сообществ OpenStreetMap и ГИС-Лаб. Участники слушают рассказы
про геоинформационные технологии и открытые геоданные, общаются с докладчиками
и делятся мыслями и новостями сами.

Организует эти встречи Илья Зверев из MAPS.ME. По любым вопросам — от новых
мероприятий до помощи с проходом — звоните [+7 925 129-34-57](tel:+79251293457) или пишите
в [телеграм](https://t.me/ilyazver) или на [ilya@zverev.info](mailto:ilya@zverev.info).
