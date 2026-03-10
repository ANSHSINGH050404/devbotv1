           CLI Client
               |
               v
           SDK Client
               |
               v
        Runtime HTTP Server
            (Hono)
               |
     -------------------------
     |           |           |
 Session     Agent Engine   Event Bus
  Store       (Core AI)      (SSE)
(SQLite)
     |           |
     v           v
 Messages     Tool Runner
  + Parts     (Files/Shell)
                    |
                    v
             Model Provider