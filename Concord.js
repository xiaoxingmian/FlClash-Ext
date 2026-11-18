function main(config) {
  const proxies = config.proxies || [];

  // =====================================
  // 基础配置
  // =====================================

  const ruleSetBaseUrl =
    "https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/";

  const regions = ["HK", "TW", "JP", "SG", "US", "AL"];

  // =====================================
  // 地区识别
  // =====================================

  const regionDefinitions = [
    {
      name: "HK",
      regex: /香港|Hong.?Kong|\bHK\b|🇭🇰/i
    },
    {
      name: "TW",
      regex: /台湾|台灣|Taiwan|\bTW\b|🇹🇼/i
    },
    {
      name: "JP",
      regex: /日本|东京|大阪|Japan|\bJP\b|🇯🇵/i
    },
    {
      name: "SG",
      regex: /新加坡|狮城|Singapore|\bSG\b|🇸🇬/i
    },
    {
      name: "US",
      regex: /美国|美國|United.?States|America|\bUS\b|🇺🇸/i
    }
  ];

  const regionNodes = Object.fromEntries(
    regions.map(region => [region, []])
  );

  proxies.forEach(proxy => {
    const name = proxy.name || "";

    const matched = regionDefinitions.find(region =>
      region.regex.test(name)
    );

    if (matched) {
      regionNodes[matched.name].push(name);
    } else {
      regionNodes.AL.push(name);
    }
  });

  // =====================================
  // Concord 自动测速策略组配置
  // =====================================

  const groupBaseOption = {
    timeout: 5000,
    url: "https://www.apple.com/library/test/success.html",
    "max-failed-times": 3,
    "empty-fallback": "REJECT"
  };

  const urlTestBaseOption = {
    ...groupBaseOption,
    type: "url-test",
    interval: 600,
    lazy: true,
    tolerance: 50,
    "exclude-type": "DIRECT"
  };

  // =====================================
  // 地区自动测速策略组
  // =====================================

  const regionGroups = regions.map(region => ({
    ...urlTestBaseOption,
    name: region,
    proxies: regionNodes[region].length
      ? regionNodes[region]
      : ["REJECT"]
  }));

  // =====================================
  // Rule Provider 通用配置
  // =====================================

  const ruleProviderCommonDomain = {
    type: "http",
    behavior: "domain",
    format: "mrs",
    interval: 86400
  };

  const ruleProviderCommonIpcidr = {
    type: "http",
    behavior: "ipcidr",
    format: "mrs",
    interval: 86400
  };

  // =====================================
  // 服务配置
  // =====================================

  const serviceConfigs = [
    {
      name: "Telegram",
      regions,
      providers: {
        telegram: {
          ...ruleProviderCommonDomain,
          url: `${ruleSetBaseUrl}geosite/telegram.mrs`,
          path: "./ruleset/telegram.mrs"
        },
        telegram_ip: {
          ...ruleProviderCommonIpcidr,
          url: `${ruleSetBaseUrl}geoip/telegram.mrs`,
          path: "./ruleset/telegram_ip.mrs"
        }
      },
      rules: [
        "RULE-SET,telegram,Telegram",
        "RULE-SET,telegram_ip,Telegram,no-resolve"
      ]
    },

    {
      name: "Netflix",
      regions,
      providers: {
        netflix: {
          ...ruleProviderCommonDomain,
          url: `${ruleSetBaseUrl}geosite/netflix.mrs`,
          path: "./ruleset/netflix.mrs"
        },
        netflix_ip: {
          ...ruleProviderCommonIpcidr,
          url: `${ruleSetBaseUrl}geoip/netflix.mrs`,
          path: "./ruleset/netflix_ip.mrs"
        }
      },
      rules: [
        "RULE-SET,netflix,Netflix",
        "RULE-SET,netflix_ip,Netflix,no-resolve"
      ]
    },

    {
      name: "Disney+",
      regions,
      providers: {
        disney: {
          ...ruleProviderCommonDomain,
          url: `${ruleSetBaseUrl}geosite/disney.mrs`,
          path: "./ruleset/disney.mrs"
        }
      },
      rules: [
        "RULE-SET,disney,Disney+"
      ]
    },

    {
      name: "YouTube",
      regions,
      providers: {
        youtube: {
          ...ruleProviderCommonDomain,
          url: `${ruleSetBaseUrl}geosite/youtube.mrs`,
          path: "./ruleset/youtube.mrs"
        }
      },
      rules: [
        "RULE-SET,youtube,YouTube"
      ]
    },

    // Bilibili：直连、香港、台湾
    {
      name: "Bilibili",
      regions: ["DIRECT", "HK", "TW"],
      providers: {
        bilibili: {
          ...ruleProviderCommonDomain,
          url: `${ruleSetBaseUrl}geosite/bilibili.mrs`,
          path: "./ruleset/bilibili.mrs"
        }
      },
      rules: [
        "RULE-SET,bilibili,Bilibili"
      ]
    },

    {
      name: "TikTok",
      regions: ["TW", "JP", "SG", "US", "AL"],
      providers: {
        tiktok: {
          ...ruleProviderCommonDomain,
          url: `${ruleSetBaseUrl}geosite/tiktok.mrs`,
          path: "./ruleset/tiktok.mrs"
        }
      },
      rules: [
        "RULE-SET,tiktok,TikTok"
      ]
    },

    {
      name: "Spotify",
      regions,
      providers: {
        spotify: {
          ...ruleProviderCommonDomain,
          url: `${ruleSetBaseUrl}geosite/spotify.mrs`,
          path: "./ruleset/spotify.mrs"
        }
      },
      rules: [
        "RULE-SET,spotify,Spotify"
      ]
    },

    {
      name: "Google",
      regions,
      providers: {
        google: {
          ...ruleProviderCommonDomain,
          url: `${ruleSetBaseUrl}geosite/google.mrs`,
          path: "./ruleset/google.mrs"
        },
        google_ip: {
          ...ruleProviderCommonIpcidr,
          url: `${ruleSetBaseUrl}geoip/google.mrs`,
          path: "./ruleset/google_ip.mrs"
        }
      },
      rules: [
        "RULE-SET,google,Google",
        "RULE-SET,google_ip,Google,no-resolve"
      ]
    },

    {
      name: "OpenAI",
      regions: ["TW", "JP", "SG", "US", "AL"],
      providers: {
        openai: {
          ...ruleProviderCommonDomain,
          url: `${ruleSetBaseUrl}geosite/openai.mrs`,
          path: "./ruleset/openai.mrs"
        },
        openai_ip: {
          ...ruleProviderCommonIpcidr,
          url: `${ruleSetBaseUrl}geoip/openai.mrs`,
          path: "./ruleset/openai_ip.mrs"
        }
      },
      rules: [
        "RULE-SET,openai,OpenAI",
        "RULE-SET,openai_ip,OpenAI,no-resolve"
      ]
    },

    {
      name: "Game",
      regions: ["DIRECT", ...regions],
      providers: {
        game: {
          ...ruleProviderCommonDomain,
          url: `${ruleSetBaseUrl}geosite/category-games.mrs`,
          path: "./ruleset/category-games.mrs"
        }
      },
      rules: [
        "RULE-SET,game,Game"
      ]
    }
  ];

  // =====================================
  // 构建软件策略组
  // =====================================

  const services = [
    {
      name: "Proxy",
      regions
    },
    ...serviceConfigs
  ];

  const serviceGroups = services.map(service => ({
    ...groupBaseOption,
    name: service.name,
    type: "select",
    proxies: service.regions
  }));

  // =====================================
  // 注册 Rule Providers
  // =====================================

  const finalRuleProviders = {};

  serviceConfigs.forEach(service => {
    Object.assign(
      finalRuleProviders,
      service.providers
    );
  });

  config["rule-providers"] = {
    ...(config["rule-providers"] || {}),
    ...finalRuleProviders
  };

  // =====================================
  // 替换机场策略组
  // =====================================

  config["proxy-groups"] = [
    ...serviceGroups,
    ...regionGroups
  ];

  // =====================================
  // 修复机场旧规则引用
  // =====================================

  const validGroups = new Set([
    ...services.map(service => service.name),
    ...regions
  ]);

  const builtinPolicies = new Set([
    "DIRECT",
    "REJECT",
    "REJECT-DROP",
    "PASS"
  ]);

  config.rules = (config.rules || []).map(rule => {
    if (typeof rule !== "string") return rule;

    const normalized = rule.replace(/，/g, ",");
    const parts = normalized.split(",");

    if (parts.length < 2) return normalized;

    const type = parts[0].trim().toUpperCase();

    const policyIndex =
      ["MATCH", "FINAL"].includes(type) ? 1 : 2;

    if (parts.length <= policyIndex) return normalized;

    const policy = parts[policyIndex].trim();

    if (
      builtinPolicies.has(policy) ||
      validGroups.has(policy)
    ) {
      return normalized;
    }

    // 机场旧策略组映射到 Proxy
    parts[policyIndex] = "Proxy";

    return parts.join(",");
  });

  // =====================================
  // 自动生成服务分流规则
  // =====================================

  const functionalRules = [];

  serviceConfigs.forEach(service => {
    functionalRules.push(...service.rules);
  });

  // 移除旧的同名 RULE-SET 规则
  const providerNames = new Set(
    serviceConfigs.flatMap(service =>
      Object.keys(service.providers)
    )
  );

  config.rules = config.rules.filter(rule => {
    if (typeof rule !== "string") return true;

    const parts = rule.replace(/，/g, ",").split(",");

    return !(
      parts[0].trim().toUpperCase() === "RULE-SET" &&
      providerNames.has((parts[1] || "").trim())
    );
  });

  // 服务规则放在最前面，确保优先匹配
  config.rules = [
    ...functionalRules,
    ...config.rules
  ];

  return config;
}
