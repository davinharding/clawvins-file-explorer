# Mission Control notes

- Socket.IO rooms per board; clients replay events since last seen timestamp on reconnect.
- Keep the DB a single SQLite file until concurrent writers become a problem.
