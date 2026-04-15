# Non-Functional Requirements - The Gathering

Nguon tham chieu: `doc/SRS.md` (Section 9 - Non-Functional Requirements).

## 1) Security

| ID     | Requirement                                                             |
| :----- | :---------------------------------------------------------------------- |
| NFR-S1 | Input phai duoc validate bang Zod schemas (body/query/socket payloads). |
| NFR-S2 | Rate limiting cho auth endpoints.                                       |
| NFR-S3 | Password hash bang bcrypt (10 rounds).                                  |
| NFR-S4 | RBAC: user vs admin roles cho admin endpoints.                          |
| NFR-S5 | JWT token cho authentication, 7-day expiry.                             |
| NFR-S6 | CORS configured theo `CLIENT_URL`.                                      |

## 2) Performance

| ID     | Requirement                                                                   |
| :----- | :---------------------------------------------------------------------------- |
| NFR-P1 | Chat message pagination, limit toi da per request.                            |
| NFR-P2 | Movement/presence throttling qua Socket.IO.                                   |
| NFR-P3 | PixiJS video bubble cap nhat 15fps (canvas-based) thay vi `PIXI.VideoSource`. |
| NFR-P4 | Max 30 players per space.                                                     |

## 3) Availability & Reliability

| ID     | Requirement                                                                  |
| :----- | :--------------------------------------------------------------------------- |
| NFR-A1 | Socket.IO auto-reconnect khi mat ket noi.                                    |
| NFR-A2 | Agora RTC fallback: hoat dong o Testing Mode neu khong co `APP_CERTIFICATE`. |
| NFR-A3 | Position memory: luu vi tri khi disconnect, restore khi re-join.             |

## 4) Usability

| ID     | Requirement                                                                  |
| :----- | :--------------------------------------------------------------------------- |
| NFR-U1 | Sidebar collapse/expand de toi uu khong gian.                                |
| NFR-U2 | View Selector cho phep chon che do hien thi.                                 |
| NFR-U3 | Sidebar dung flex layout (khong fixed positioning) de khong bi mat khi zoom. |

## 5) Compatibility

| ID     | Requirement                                       |
| :----- | :------------------------------------------------ |
| NFR-C1 | Ho tro Chrome, Edge, Firefox phien ban hien dai.  |
| NFR-C2 | WebRTC qua Agora SDK xu ly NAT traversal tu dong. |

## 6) Data Validation Constraints

| Field                  | Constraint       |
| :--------------------- | :--------------- |
| Display Name           | Toi da 100 ky tu |
| In-game Bubble Message | Toi da 300 ky tu |
| Chat Message           | Toi da 500 ky tu |
| Bio                    | Toi da 500 ky tu |

## Ghi chu traceability

- NFR list nay duoc tach rieng de phuc vu bao cao, slide, va kiem thu.
- Khi cap nhat NFR trong SRS, can dong bo file nay de tranh lech tai lieu.
