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
# {{ post.title }}
{% endif %}
{{ post.content }}
{% assign first = false %}
{% endunless %}{% endif %}
{% endfor %}

## Все встречи

{% for post in site.posts %}
* {{ post.evdate }}: [{{ post.title }}]({{ post.url }}){% if post.youtube %} ([видео](https://www.youtube.com/playlist?list={{ post.youtube }})){% endif %}
{% endfor %}

## Что это?

«Схемотехника» — главная и единственная серия московских встреч ГИС-энтузиастов
из сообществ OpenStreetMap и ГИС-Лаб. Участники слушают рассказы
про геоинформационные технологии и открытые геоданные, общаются с докладчиками
и делятся мыслями и новостями сами.

Чтобы не пропускать мероприятия и публикации видеозаписей, подпишитесь
на [канал в Telegram](https://t.me/schemotechnika).

Организует эти встречи Илья Зверев из MAPS.ME. По любым вопросам — от новых
мероприятий до помощи с проходом — звоните [+7 925 129-34-57](tel:+79251293457) или пишите
в [телеграм](https://t.me/ilyazver) или на [ilya@zverev.info](mailto:ilya@zverev.info).
