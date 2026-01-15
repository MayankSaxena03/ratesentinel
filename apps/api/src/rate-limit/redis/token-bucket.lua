local bucket = redis.call("HMGET", KEYS[1], "tokens", "last_refill_ts")

local tokens = tonumber(bucket[1])
local last_refill_ts = tonumber(bucket[2])

if tokens == nil then
  tokens = tonumber(ARGV[1])
  last_refill_ts = tonumber(ARGV[3])
end

local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local cost = tonumber(ARGV[4])

local elapsed_ms = now - last_refill_ts
if elapsed_ms > 0 then
  local refill = (elapsed_ms / 1000) * refill_rate
  tokens = math.min(capacity, tokens + refill)
end

local allowed = 0
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
end

redis.call(
  "HMSET",
  KEYS[1],
  "tokens", tokens,
  "last_refill_ts", now
)

redis.call("PEXPIRE", KEYS[1], math.ceil((capacity / refill_rate) * 1000 * 2))

return { allowed, tokens }