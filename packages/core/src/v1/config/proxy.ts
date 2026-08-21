export * as ConfigProxyV1 from "./proxy"

import { Schema } from "effect"

export const ProxyType = Schema.Literal("http", "https", "socks4", "socks5").annotate({
  description: "Type of proxy",
})
export type ProxyType = Schema.Schema.Type<typeof ProxyType>

export const Port = Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 65535 })).annotate({
  description: "Proxy port",
})

export const Entry = Schema.Struct({
  type: ProxyType,
  host: Schema.String.annotate({ description: "Proxy hostname or IP address" }),
  port: Port,
  username: Schema.optional(Schema.String).annotate({ description: "Proxy username (SOCKS5 auth or HTTP basic auth)" }),
  password: Schema.optional(Schema.String).annotate({ description: "Proxy password" }),
  label: Schema.optional(Schema.String).annotate({ description: "Optional display label" }),
}).annotate({ identifier: "ProxyEntry" })
export type Entry = Schema.Schema.Type<typeof Entry>

export const Info = Schema.Struct({
  enabled: Schema.optional(Schema.Boolean).annotate({
    description:
      "When true, route outbound traffic through the configured proxy list (in order) instead of using environment proxy variables. Defaults to false.",
  }),
  list: Schema.optional(Schema.mutable(Schema.Array(Entry))).annotate({
    description: "Ordered proxy list. The first reachable proxy in the list is used, with the rest serving as failover.",
  }),
}).annotate({ identifier: "ProxyConfig" })
export type Info = Schema.Schema.Type<typeof Info>
