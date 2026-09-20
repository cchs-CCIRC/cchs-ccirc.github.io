# 💻 CCIRC Official Website

**精誠中學資訊讀書會 ·** ***C**hing **C**heng High School **I**nformation **R**eading **C**lub*

> *Learn to code. Think deeper. Build together.*

[![Website](https://img.shields.io/badge/Website-CCIRC-10B981?style=flat-square\&logo=google&logoColor=white)](https://cchs-ccirc.github.io/)
[![GitHub](https://img.shields.io/badge/GitHub-CCIRC-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/cchs-CCIRC)
[![Instagram](https://img.shields.io/badge/Instagram-@cchs_ccirc2026-E4405F?style=flat-square\&logo=instagram&logoColor=white)](https://www.instagram.com/cchs_ccirc2026/)

---
## 📁 Project Structure

```text
cchs-ccirc.github.io/

├── css/              # Stylesheets
├── images/           # Images and visual assets
├── js/               # JavaScript files
├── pages/            # Additional website pages
├── index.html        # Homepage
├── 404.html          # Custom 404 page
├── favicon.ico       # Website favicon
├── robots.txt        # Search engine crawling rules
├── sitemap.xml       # Sitemap for search engines
├── _headers          # Website security / HTTP headers
├── wrangler.toml     # Deployment configuration
└── README.md         # Project documentation
```

---


### 教材庫全文搜尋

教材庫支援以 HackMD 筆記正文進行全文搜尋。搜尋索引由 `tools/build-resource-search-index.mjs` 建立，並透過 `.github/workflows/update-resource-search.yml` 自動更新。

- `js/resources-data.js`：教材 metadata 與 HackMD URL
- `js/resources-search-index.js`：自動產生的全文搜尋索引
- `tools/build-resource-search-index.mjs`：抓取公開 HackMD Markdown 並建立索引
- GitHub Actions：修改教材資料時更新，並每日定期同步一次
