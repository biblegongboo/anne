(async function () {
  const cfg = window.ANNE_SUPABASE_CONFIG || {};
  const target = document.getElementById("catalog");

  if (!cfg.enabled) {
    if (target) target.textContent = "App is disabled.";
    return;
  }

  if (!cfg.url || !cfg.publishableKey || !cfg.functionName) {
    if (target) target.textContent = "Supabase config is not set yet.";
    return;
  }

  try {
    const response = await fetch(cfg.url.replace(/\/+$/, "") + "/functions/v1/" + cfg.functionName, {
      method: "POST",
      headers: {
        apikey: cfg.publishableKey,
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify({ action: "catalog" }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Catalog unavailable.");

    if (!Array.isArray(data.sources) || !data.sources.length) {
      target.textContent = "No enabled sources yet.";
      return;
    }

    target.innerHTML =
      "<ul>" +
      data.sources.map(function (source) {
        return (
          "<li><strong>" +
          String(source.title || source.source_id || "") +
          "</strong> " +
          "(" +
          String(source.source_id || "") +
          ", sample " +
          String(source.sample_limit || 20) +
          ")" +
          "</li>"
        );
      }).join("") +
      "</ul>";
  } catch (error) {
    if (target) target.textContent = error.message || String(error);
  }
})();
