# -*- coding: utf-8 -*-
"""Генерация отчёта по лабораторной работе № 8 (PostgreSQL)."""
from docx import Document
from docx.shared import Pt, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from pathlib import Path

doc = Document()
for section in doc.sections:
    section.top_margin = Cm(2)
    section.bottom_margin = Cm(2)
    section.left_margin = Cm(3)
    section.right_margin = Cm(1.5)


def set_run_font(run, size=14, bold=False, name="Times New Roman"):
    run.font.name = name
    run._element.rPr.rFonts.set(qn("w:eastAsia"), name)
    run.font.size = Pt(size)
    run.bold = bold


def add_para(text, size=14, bold=False, align="justify", first_line=True):
    p = doc.add_paragraph()
    if align == "center":
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif align == "left":
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    else:
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    pf = p.paragraph_format
    pf.space_after = Pt(6)
    pf.line_spacing = 1.5
    pf.first_line_indent = Cm(1.25) if (first_line and align == "justify") else Cm(0)
    run = p.add_run(text)
    set_run_font(run, size=size, bold=bold)
    return p


def add_h(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.line_spacing = 1.5
    run = p.add_run(text)
    set_run_font(run, bold=True)
    return p


# Титул
for line in [
    "МИНИСТЕРСТВО НАУКИ И ВЫСШЕГО ОБРАЗОВАНИЯ РОССИЙСКОЙ ФЕДЕРАЦИИ",
    "Федеральное государственное автономное образовательное учреждение высшего образования",
    "«Южный федеральный университет» Инженерно-технологическая академия",
    "Институт компьютерных технологий и информационной безопасности",
]:
    add_para(line, align="center", first_line=False, size=12)

add_para("")
add_para("ОТЧЕТ", align="center", bold=True, first_line=False)
add_para("по лабораторной работе № 8", align="center", first_line=False)
add_para("Дисциплина: Разработка Web-приложений", align="center", first_line=False)
add_para("Тема: Создание и заполнение БД в PostgreSQL", align="center", first_line=False)
add_para("")
add_para("Выполнил: ст-т группы КТбо3-2 Михайлов М. И.", align="left", first_line=False)
add_para("Преподаватель: ассистент кафедры САиТ Шевцов А. П.", align="left", first_line=False)
doc.add_page_break()

add_h("1. Общие сведения")
add_para(
    "В работе № 7 сервер Express отдавал каталог из JSON-файлов. В работе № 8 данные перенесены "
    "в реляционную СУБД PostgreSQL. Клиент React не менялся по API: те же маршруты /api/categories, "
    "/api/products, /api/orders и т.д., но ответы формируются SQL-запросами."
)
add_para(
    "Реализованы две базы данных в одном локальном кластере (порт 5433): bazmet — каталог продукции "
    "и изображения; bazmet_orders — пользователи (customers) и их заявки (orders) со связью "
    "FOREIGN KEY. Картинки каталога дополнительно загружены в таблицу images как BYTEA."
)

add_h("2. Что сделано по пунктам задания")
add_para(
    "1) Продумано хранение и созданы базы bazmet и bazmet_orders (файлы src/schema.sql и "
    "src/schema-orders.sql)."
)
add_para(
    "2) Базы заполнены: npm run seed загружает data/catalog.json, 23 JPG в images (BYTEA), "
    "демо-пользователей и заявки."
)
add_para(
    "3) Сервер переведён на БД: два пула соединений pg (src/db.js); каталог — catalogService.js, "
    "заявки — ordersService.js (upsert клиента по email + INSERT заказа)."
)

add_h("3. Обоснование выбора PostgreSQL")
add_para(
    "Для каталога метизов выбран PostgreSQL: естественное деление на таблицы, SQL-фильтры "
    "(type, standard, ANY(materials)), JSONB/массивы для fields и filters, ACID для заявок, "
    "хранение файлов в BYTEA. MongoDB удобна для документов «как JSON», но связи customers→orders "
    "и учебные отчёты проще в реляционной модели."
)

add_h("4. Схема баз данных")
add_para("БД bazmet (каталог):", bold=True, first_line=False)
add_para(
    "categories — id, title, img, path; services — услуги; products — изделия (materials[], "
    "coatings[], specs[], fields JSONB); filters — селекты каталога; images — path, content_type, "
    "data BYTEA.",
    first_line=False,
)
add_para("БД bazmet_orders (заявки):", bold=True, first_line=False)
add_para(
    "customers — id, name, phone, email UNIQUE, created_at; orders — id, customer_id → customers(id), "
    "service, description, created_at.",
    first_line=False,
)

add_h("5. Подключение")
add_para(
    "В .env заданы DATABASE_URL=postgresql://bazmet@127.0.0.1:5433/bazmet и "
    "ORDERS_DATABASE_URL=postgresql://bazmet@127.0.0.1:5433/bazmet_orders. Кластер проекта: "
    ".pg-bazmet (npm run db:start / db:stop). GET /api/health возвращает "
    "storage=postgresql и databases={catalog:bazmet, orders:bazmet_orders}."
)

add_h("6. Взаимодействие с клиентом")
add_para(
    "React (порт 5173) через Vite proxy вызывает /api. При открытии каталога выполняются "
    "SELECT к bazmet; при отправке заявки — UPSERT в customers и INSERT в orders базы "
    "bazmet_orders. Картинки /images/:file отдаются из таблицы images (BYTEA), с запасным "
    "вариантом файлов на диске public/images."
)

add_h("7. Проверка записи заявки в БД")
add_para(
    "POST http://127.0.0.1:3001/api/orders с JSON (name, phone, email, service, description). "
    "В терминале API: [API] POST /api/orders → 201. В psql к bazmet_orders:",
    first_line=False,
)
add_para(
    "SELECT c.name, c.email, o.id, o.service FROM customers c "
    "JOIN orders o ON o.customer_id = c.id;",
    align="left",
    first_line=False,
)

add_h("8. Запуск")
add_para(
    "cd /Users/maksim/Documents/database && npm run db:start && npm run seed && npm run dev. "
    "Клиент: cd /Users/maksim/Documents/react && npm run dev. "
    "Сайт: http://127.0.0.1:5173/ ; API: http://127.0.0.1:3001/api/health.",
    first_line=False,
)

add_h("9. Вывод")
add_para(
    "В работе № 8 каталог и заявки БазМет хранятся в PostgreSQL. Реализованы две связанные по "
    "назначению базы, загрузка изображений в BYTEA, REST API на двух пулах pg. Клиент React "
    "использует тот же API, что и в работе № 7."
)

add_para("")
add_para("Таганрог 2026", align="center", first_line=False)

# Один канонический файл в Documents (без копии в папке проекта)
path = Path("/Users/maksim/Documents/РВБ-8.docx")
doc.save(path)
print("saved", path)
# Убрать устаревший .doc, если остался
old_doc = Path("/Users/maksim/Documents/РВБ-8.doc")
if old_doc.exists():
    old_doc.unlink()
    print("removed", old_doc)
