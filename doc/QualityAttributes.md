# Quality Attributes - The Gathering

Nguon tham chieu:

- `doc/SRS.md` (Section 9 - Non-Functional Requirements)
- `doc/Functional_Requirements.md`
- `doc/Non_Functional_Requirements.md`

## 1. Muc dich

Tai lieu nay mo ta cac thuoc tinh chat luong (Quality Attributes) cua he thong The Gathering theo huong co the do luong va kiem chung.

Muc tieu:

- Bien NFR thanh cac scenario co metric ro rang.
- Ho tro QA team lap test plan va acceptance criteria.
- Dam bao traceability giua QA <-> NFR <-> implementation.

## 2. Pham vi he thong

- Frontend: Next.js + PixiJS.
- Backend: Express + MongoDB.
- Realtime: Socket.IO.
- Media: Agora RTC (cloud SFU).
- Auth: JWT, OTP, Google OAuth.

## 3. Quality Attribute Scenarios

### 3.1 Security

| QA ID     | Stimulus / Context                                     | Expected Response                            | Metric / Acceptance                                                                |
| :-------- | :----------------------------------------------------- | :------------------------------------------- | :--------------------------------------------------------------------------------- |
| QA-SEC-01 | Client gui payload sai schema vao REST/socket          | He thong tu choi request, khong mutate state | 100% request sai schema bi reject (HTTP 4xx hoac event ignore), khong crash server |
| QA-SEC-02 | Nguoi dung thu truy cap route admin khi role != admin  | He thong chan truy cap                       | 100% request tra `403`                                                             |
| QA-SEC-03 | Nguoi dung gui nhieu request auth lien tuc             | He thong rate-limit                          | Request vuot nguong tra `429`, endpoint van on dinh                                |
| QA-SEC-04 | Token het han/khong hop le duoc dung de goi API bao ve | He thong tu choi                             | 100% request tra `401`                                                             |
| QA-SEC-05 | Password duoc luu khi dang ky                          | He thong chi luu hash                        | 0 plaintext password trong DB dump                                                 |

Mapping NFR: `NFR-S1`, `NFR-S2`, `NFR-S3`, `NFR-S4`, `NFR-S5`, `NFR-S6`.

### 3.2 Performance

| QA ID      | Stimulus / Context                                 | Expected Response                          | Metric / Acceptance                                |
| :--------- | :------------------------------------------------- | :----------------------------------------- | :------------------------------------------------- |
| QA-PERF-01 | User join realm qua `joinRealm`                    | Handshake nhanh, vao map thanh cong        | p95 join time <= 3s                                |
| QA-PERF-02 | User di chuyen lien tuc trong room co nhieu player | Dong bo vi tri muot                        | p95 move broadcast <= 100ms                        |
| QA-PERF-03 | Teleport giua rooms                                | Su kien leave/join duoc phat dung va nhanh | p95 teleport propagation <= 150ms                  |
| QA-PERF-04 | Tai lich su chat theo trang                        | API phan trang tra ve nhanh                | p95 response <= 2s                                 |
| QA-PERF-05 | Tai scene co video bubble                          | FPS on dinh o muc muc tieu                 | Video bubble update ~15fps, khong lag nghiem trong |

Mapping NFR: `NFR-P1`, `NFR-P2`, `NFR-P3`, `NFR-P4`.

### 3.3 Availability & Reliability

| QA ID     | Stimulus / Context                        | Expected Response                            | Metric / Acceptance                                   |
| :-------- | :---------------------------------------- | :------------------------------------------- | :---------------------------------------------------- |
| QA-AVL-01 | Mat ket noi Socket tam thoi               | Client tu reconnect                          | Auto-reconnect thanh cong trong <= 10s (mang on dinh) |
| QA-AVL-02 | User disconnect roi reconnect             | Vi tri duoc phuc hoi dung realm              | Restore dung `lastPositions` >= 99% case test         |
| QA-AVL-03 | Agora khong co certificate (testing mode) | Call flow van khoi tao theo fallback         | 100% moi truong test van khoi tao call signal         |
| QA-AVL-04 | User bi mat mang trong call/chat          | UI thong bao trang thai va co duong quay lai | Co state disconnected + retry option hien thi         |

Mapping NFR: `NFR-A1`, `NFR-A2`, `NFR-A3`.

### 3.4 Usability

| QA ID     | Stimulus / Context                     | Expected Response                     | Metric / Acceptance                                 |
| :-------- | :------------------------------------- | :------------------------------------ | :-------------------------------------------------- |
| QA-USE-01 | User can thao tac map + chat dong thoi | Sidebar chat co the an/hien           | 100% trang play co toggle collapse/expand hoat dong |
| QA-USE-02 | User doi che do xem                    | View selector cap nhat giao dien dung | 100% view mode hop le chuyen duoc khong reload      |
| QA-USE-03 | User zoom/pan scene                    | Sidebar khong bi mat khoi viewport    | Sidebar van thao tac duoc o cac muc zoom test       |
| QA-USE-04 | User nhap text dai/invalid             | Form bao loi ro rang                  | Loi field-level hien thi truoc submit               |

Mapping NFR: `NFR-U1`, `NFR-U2`, `NFR-U3`.

### 3.5 Compatibility

| QA ID      | Stimulus / Context                     | Expected Response           | Metric / Acceptance                          |
| :--------- | :------------------------------------- | :-------------------------- | :------------------------------------------- |
| QA-COMP-01 | Chay tren Chrome/Edge/Firefox hien dai | Tinh nang cot loi hoat dong | 100% smoke test pass tren 3 browser          |
| QA-COMP-02 | User sau NAT/firewall join call Agora  | Kenh media duoc thiet lap   | Join call thanh cong trong test NAT pho bien |

Mapping NFR: `NFR-C1`, `NFR-C2`.

### 3.6 Data Integrity & Validation

| QA ID      | Stimulus / Context                    | Expected Response       | Metric / Acceptance            |
| :--------- | :------------------------------------ | :---------------------- | :----------------------------- |
| QA-DATA-01 | DisplayName > 100 ky tu               | Tu choi cap nhat        | 100% request bi reject         |
| QA-DATA-02 | Bubble message > 300 ky tu            | Khong broadcast message | 100% message bi block          |
| QA-DATA-03 | Chat message > 500 ky tu (persistent) | Tu choi luu DB          | 0 ban ghi vuot nguong trong DB |
| QA-DATA-04 | Bio > 500 ky tu                       | Tu choi cap nhat        | 100% request bi reject         |

Mapping NFR: Data constraints in `doc/Non_Functional_Requirements.md`.

## 4. QA Test Strategy (tom tat)

### 4.1 Test levels

- Unit test: validation helpers, auth utilities, business rules.
- Integration test: REST routes + DB interactions.
- Realtime test: Socket events (`joinRealm`, `movePlayer`, `teleport`, call signaling).
- E2E test: luong nguoi dung chinh (auth -> join realm -> chat -> call -> event).

### 4.2 Test types

- Functional correctness (FR coverage).
- Non-functional verification (performance, reliability, security).
- Negative tests (invalid input, unauthorized access, rate limit).
- Regression tests (sau moi thay doi sprint).

### 4.3 Moi truong test

- Local dev (Node + MongoDB local).
- Staging (gan production settings).
- Browser matrix: Chrome, Edge, Firefox.

## 5. Traceability Matrix (QA <-> NFR)

| NFR Group                  | NFR IDs                | QA Scenarios   |
| :------------------------- | :--------------------- | :------------- |
| Security                   | NFR-S1..S6             | QA-SEC-01..05  |
| Performance                | NFR-P1..P4             | QA-PERF-01..05 |
| Availability & Reliability | NFR-A1..A3             | QA-AVL-01..04  |
| Usability                  | NFR-U1..U3             | QA-USE-01..04  |
| Compatibility              | NFR-C1..C2             | QA-COMP-01..02 |
| Data Constraints           | Validation constraints | QA-DATA-01..04 |

## 6. Release Gate (de xuat)

Mot release duoc xem la dat QA gate khi:

1. 100% P0 FR pass.
2. 100% Security tests pass (khong co High/Critical open issue).
3. p95 metrics dat nguong cho join/move/teleport/chat APIs theo Section 3.
4. Smoke test cross-browser pass tren Chrome/Edge/Firefox.
5. Khong con bug blocker o luong cot loi: Auth, Join Realm, Realtime Move, Chat, Call.

## 7. Ghi chu van hanh

- Moi thay doi NFR trong `SRS.md` phai cap nhat file nay cung sprint.
- ID QA scenario la on dinh de team co the tham chieu trong test reports.
