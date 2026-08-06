# `DROP_UPDATE_REF` WebSocket contract

`DROP_UPDATE_REF` is the additive fallback when a full drop creation, rating,
or reaction update would exceed the application WebSocket frame ceiling.

The message carries only the immutable lookup coordinates:

```json
{
  "type": "DROP_UPDATE_REF",
  "data": {
    "drop_id": "drop-id",
    "wave_id": "wave-id",
    "author_id": "author-profile-id",
    "serial_no": 123,
    "update_type": "DROP_UPDATE",
    "reason": "POLL_RESPONSE"
  }
}
```

`drop_id`, `wave_id`, and `author_id` must be non-empty strings. `serial_no`
must be a finite, non-negative integer. `update_type` must be one of
`DROP_UPDATE`, `DROP_RATING_UPDATE`, or `DROP_REACTION_UPDATE`. `reason` is
optional and is present only when the original event carries a non-empty
reason. The client treats the payload as untrusted and ignores it when any of
these conditions is not met. The stable author profile ID lets unread counters
preserve the existing own-post suppression without fetching drop content.

The reference contains no drop content. The primary wave feed resolves the
canonical drop by `drop_id`, then routes it through the ordinary update path
selected by `update_type`. Repeated references for one drop and update type are
coalesced, and a bounded retry backoff covers read-replica lag. The serial
number remains part of the contract for identity and observability; it is not a
staleness gate because rating, reaction, and content updates can retain the
same serial number.

Wave-list hooks also schedule their existing debounced feed refetch. This is
intentional: several list surfaces do not mount the central realtime updater,
and would otherwise remain stale. Where both paths are mounted, API-level exact
drop batching and feed debouncing bound the duplicate work; compact refs are
reserved for unusually large events.

The backend selects this message only after measuring the final UTF-8 byte
length of the exact JSON sent to that recipient. The application ceiling is
28 KiB (`28 * 1024` bytes), below API Gateway's 32 KiB WebSocket frame limit.
Messages at or below that ceiling retain their existing full update shape.
