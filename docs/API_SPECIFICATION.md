# Official Moonton MLBB GMS API Specification

This document details the reverse-engineered internal API protocol powering the official Mobile Legends: Bang Bang Rank Leaderboard (`https://www.mobilelegends.com/rank`).

---

## 1. Architecture Overview

Moonton serves the website through a client-side React Single Page Application (SPA) driven by their internal **Game Management System (GMS)**.
All rank records, hero statistics, win rates, and counters are queried dynamically from `api.gms.moontontech.com`.

### Base URLs
- **GMS API Gateway:** `https://api.gms.moontontech.com`
- **Youngjoy Static Assets CDN:** `https://akmweb.youngjoygame.com`

---

## 2. Authentication & Signing Protocol

Requests to `api.gms.moontontech.com` require an ephemeral HMAC-SHA1 signature passed in the `Authorization` header.

### Step 1: Retrieve the Enigma Token
Call the `basev4` handshake endpoint:
- **Method:** `GET`
- **URL:** `https://api.gms.moontontech.com/api/act/basev4?_t=<timestamp_ms>`
- **Headers:**
  - `x-actid`: `2669607`
  - `x-appid`: `2669606`
  - `User-Agent`: Chrome/Safari UA string
- **Response Format:**
  ```json
  {
    "code": 0,
    "message": "OK",
    "data": {
      "server": {
        "enigma": "d70391ab690e8e59d925a93a4c1d1798",
        "time": 1790363628583
      }
    }
  }
  ```
The `enigma` token is valid for several hours. Our client caches it with a 10-minute TTL.

### Step 2: Calculate Request Signature
The signature is generated using HMAC-SHA1 on a newline-separated payload:
$$\text{message} = \text{METHOD.upper()} + \text{"\\n"} + \text{PATH} + \text{"\\n"} + \text{QUERY\_PARAMS} + \text{"\\n"} + \text{BODY\_JSON}$$
$$\text{Authorization} = \text{Base64}\big(\text{HMAC-SHA1}(\text{key}=\text{enigma},\; \text{message})\big)$$

*Note:* In Python, `BODY_JSON` must use `json.dumps(payload, separators=(',', ':'))` to match JavaScript's `JSON.stringify` formatting without whitespace.

---

## 3. Official CDN Hero Database

- **Endpoint:** `GET https://akmweb.youngjoygame.com/web/svnres/mlbb/homepage_2_1_41/latest/en_hero_list.json`
- **Access:** Public CDN, static JSON, no signature required.
- **Payload Schema:**
  ```json
  {
    "hero_list": [
      {
        "heroid": 1,
        "name": "Miya",
        "head": "https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_da894b37bfb5cadb32307f371f31918a.png",
        "sortlabel": ["Marksman", ""],
        "roadsortlabel": ["Gold Lane", ""],
        "speciality": ["Reap", "Damage"],
        "difficulty": "20",
        "heroskilllist": [
          {
            "skilllist": [
              {
                "skillid": 101,
                "skillname": "Moon Blessing",
                "skilldesc": "...",
                "skillicon": "..."
              }
            ]
          }
        ]
      }
    ]
  }
  ```

---

## 4. Rank Leaderboard Endpoint

- **Method:** `POST`
- **URL:** `https://api.gms.moontontech.com/api/gms/source/2669606/<source_id>`
- **Headers:**
  - `Authorization`: `<generated HMAC-SHA1 signature>`
  - `x-actid`: `2669607`
  - `x-appid`: `2669606`
  - `x-lang`: `en`
  - `Content-Type`: `application/json;charset=UTF-8`

### Source IDs (Timeframe Mapping)
| Source ID | Timeframe | Description |
|-----------|-----------|-------------|
| `2756567` | `1d` | Past 1 day |
| `2756568` | `3d` | Past 3 days |
| `2756569` | `7d` | Past 7 days |
| `2756565` | `15d` | Past 15 days |
| `2756570` | `30d` | Past 30 days |

### Rank Filter Codes (`bigrank`)
| Code | Rank Bracket |
|------|--------------|
| `"101"` | ALL Ranks |
| `"5"` | Epic |
| `"6"` | Legend |
| `"7"` | Mythic |
| `"8"` | Mythical Honor |
| `"9"` | Mythical Glory+ |

### Match Type Codes (`match_type`)
| Value | Type | Description |
|-------|------|-------------|
| `0` | Counters | Top 5 counter heroes that suppress the hero |
| `1` | Synergies | Top 5 compatible teammate heroes that increase win rate |

### Request Payload Format
```json
{
  "pageSize": 200,
  "pageIndex": 1,
  "filters": [
    {"field": "bigrank", "operator": "eq", "value": "101"},
    {"field": "match_type", "operator": "eq", "value": 0}
  ],
  "sorts": [
    {"data": {"field": "main_hero_win_rate", "order": "desc"}, "type": "sequence"},
    {"data": {"field": "main_heroid", "order": "desc"}, "type": "sequence"}
  ],
  "fields": [
    "main_hero",
    "main_hero_appearance_rate",
    "main_hero_ban_rate",
    "main_hero_channel",
    "main_hero_win_rate",
    "main_heroid",
    "data.sub_hero.hero",
    "data.sub_hero.hero_channel",
    "data.sub_hero.increase_win_rate",
    "data.sub_hero.heroid"
  ]
}
```

### Record Response Schema
```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "total": 133,
    "records": [
      {
        "data": {
          "main_heroid": 14,
          "main_hero_win_rate": 0.594379,
          "main_hero_appearance_rate": 0.011859,
          "main_hero_ban_rate": 0.146545,
          "main_hero": {
            "data": {
              "name": "Rafaela",
              "head": "https://akmweb.youngjoygame.com/web/svnres/img/test/homepage_2_2_16_1232_1/100_68277dce415742c4a98883151c693a07.png"
            }
          },
          "sub_hero": [
            {
              "heroid": 57,
              "increase_win_rate": 0.035314,
              "hero": {
                "data": {
                  "head": "https://akmweb.youngjoygame.com/web/svnres/img/test/homepage_2_2_16_1232_1/100_bf16690876761b80822df90eb3320d69.png"
                }
              }
            }
          ]
        }
      }
    ]
  }
}
```
