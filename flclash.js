function main(config) {
  const proxies = config.proxies || [];

  // ==============================
  // 地区识别规则
  // ==============================

  const regionRules = {
    HK: /香港|Hong.?Kong|\bHK\b|🇭🇰/i,
    TW: /台湾|台灣|Taiwan|\bTW\b|🇹🇼/i,
    JP: /日本|Japan|\bJP\b|🇯🇵/i,
    SG: /新加坡|狮城|Singapore|\bSG\b|🇸🇬/i,
    US: /美国|美國|United.?States|\bUS\b|🇺🇸/i
  };

  // ==============================
  // 服务策略组
  // ==============================

  const services = [
    "Proxy",
    "Telegram",
    "Netflix",
    "Disney+",
    "YouTube",
    "TikTok",
    "Spotify",
    "Google",
    "OpenAI",
    "Game"
  ];

  // 地区列表
  const regions = [
    "HK",
    "TW",
    "JP",
    "SG",
    "US",
    "AL"
  ];

  // ==============================
  // 自动识别节点地区
  // ==============================

  const regionNodes = {};

  regions.forEach(region => {
    regionNodes[region] = [];
  });

  proxies.forEach(proxy => {
    const name = proxy.name || "";
    let matched = false;

    for (const [region, regex] of Object.entries(regionRules)) {
      if (regex.test(name)) {
        regionNodes[region].push(name);
        matched = true;
        break;
      }
    }

    if (!matched) {
      regionNodes.AL.push(name);
    }
  });

  // ==============================
  // 创建地区策略组
  // ==============================

  const regionGroups = regions.map(region => ({
    name: region,
    type: "select",
    proxies: regionNodes[region].length
      ? regionNodes[region]
      : ["REJECT"]
  }));

  // ==============================
  // 创建服务策略组
  // ==============================

  const serviceGroups = services.map(service => ({
    name: service,
    type: "select",
    proxies: regions
  }));

  // 服务组在前，地区组在后
  config["proxy-groups"] = [
    ...serviceGroups,
    ...regionGroups
  ];

  // ==============================
  // 远程规则集
  // ==============================

  const providerCommon = {
    type: "http",
    behavior: "classical",
    interval: 86400
  };

  config["rule-providers"] = {
    ...(config["rule-providers"] || {}),

    Telegram: {
      ...providerCommon,
      format: "yaml",
      url: "https://yfamilys.com/rule/Telegram.rule",
      path: "./ruleset/Telegram.yaml"
    },

    Netflix: {
      ...providerCommon,
      format: "text",
      url: "https://yfamilys.com/rule/Netflix.list",
      path: "./ruleset/Netflix.list"
    },

    Disney: {
      ...providerCommon,
      format: "yaml",
      url: "https://yfamilys.com/rule/Disney.rule",
      path: "./ruleset/Disney.yaml"
    },

    YouTube: {
      ...providerCommon,
      format: "yaml",
      url: "https://yfamilys.com/rule/YouTube.rule",
      path: "./ruleset/YouTube.yaml"
    },

    TikTok: {
      ...providerCommon,
      format: "yaml",
      url: "https://yfamilys.com/rule/TikTok.rule",
      path: "./ruleset/TikTok.yaml"
    },

    Spotify: {
      ...providerCommon,
      format: "yaml",
      url: "https://yfamilys.com/rule/Spotify.rule",
      path: "./ruleset/Spotify.yaml"
    },

    Google: {
      ...providerCommon,
      format: "yaml",
      url: "https://yfamilys.com/rule/Google.rule",
      path: "./ruleset/Google.yaml"
    },

    OpenAI: {
      ...providerCommon,
      format: "yaml",
      url: "https://yfamilys.com/rule/OpenAI.rule",
      path: "./ruleset/OpenAI.yaml"
    },

    Game: {
      ...providerCommon,
      format: "yaml",
      url: "https://yfamilys.com/rule/Game.rule",
      path: "./ruleset/Game.yaml"
    }
  };

  // ==============================
  // 有效策略组
  // ==============================

  const validGroups = new Set([
    ...regions,
    ...services
  ]);

  const builtinPolicies = new Set([
    "DIRECT",
    "REJECT",
    "REJECT-DROP",
    "PASS"
  ]);

  // ==============================
  // 修复机场旧规则
  // ==============================

  config.rules = (config.rules || []).map(rule => {
    if (typeof rule !== "string") {
      return rule;
    }

    const normalized = rule.replace(/，/g, ",");
    const parts = normalized.split(",");

    if (parts.length < 2) {
      return normalized;
    }

    const type = parts[0].trim().toUpperCase();

    const policyIndex = ["MATCH", "FINAL"].includes(type)
      ? 1
      : 2;

    if (parts.length <= policyIndex) {
      return normalized;
    }

    const policy = parts[policyIndex].trim();

    if (
      builtinPolicies.has(policy) ||
      validGroups.has(policy)
    ) {
      return normalized;
    }

    parts[policyIndex] = "Proxy";

    return parts.join(",");
  });

  // ==============================
  // 服务分流规则
  // ==============================

  const serviceRules = [
    "RULE-SET,Telegram,Telegram",
    "RULE-SET,Netflix,Netflix",
    "RULE-SET,Disney,Disney+",
    "RULE-SET,YouTube,YouTube",
    "RULE-SET,TikTok,TikTok",
    "RULE-SET,Spotify,Spotify",
    "RULE-SET,Google,Google",
    "RULE-SET,OpenAI,OpenAI",
    "RULE-SET,Game,Game"
  ];

  // 删除旧的同名规则，避免重复
  const providerNames = new Set([
    "Telegram",
    "Netflix",
    "Disney",
    "YouTube",
    "TikTok",
    "Spotify",
    "Google",
    "OpenAI",
    "Game"
  ]);

  config.rules = config.rules.filter(rule => {
    if (typeof rule !== "string") {
      return true;
    }

    const parts = rule.replace(/，/g, ",").split(",");

    return !(
      parts[0].trim().toUpperCase() === "RULE-SET" &&
      providerNames.has((parts[1] || "").trim())
    );
  });

  // 插入到 MATCH / FINAL 兜底规则之前
  const matchIndex = config.rules.findIndex(rule =>
    typeof rule === "string" &&
    /^(MATCH|FINAL),/i.test(rule.trim())
  );

  if (matchIndex === -1) {
    config.rules.push(...serviceRules);
  } else {
    config.rules.splice(matchIndex, 0, ...serviceRules);
  }

  return config;
}
