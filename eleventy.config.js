import fs from "node:fs";
import path from "node:path";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy("assets/img/**");
  eleventyConfig.addPassthroughCopy("assets/fonts/**");
  eleventyConfig.addPassthroughCopy({
    "assets/favicon.png": "assets/favicon.png",
    "assets/apple-touch-icon.png": "assets/apple-touch-icon.png",
  });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/js": "js" });

  eleventyConfig.addGlobalData("buildDate", () => new Date());

  eleventyConfig.addFilter("htmlDateString", (value) => {
    const d = value instanceof Date ? value : new Date(value);
    return d.toISOString().slice(0, 10);
  });

  eleventyConfig.addFilter("fileLastMod", (inputPath) => {
    if (!inputPath || !fs.existsSync(inputPath)) {
      return new Date().toISOString().slice(0, 10);
    }
    return fs.statSync(inputPath).mtime.toISOString().slice(0, 10);
  });

  eleventyConfig.addFilter("absoluteUrl", (value, base) => {
    const site = (base && base.url) || "https://aps-logiciel.fr";
    const root = site.replace(/\/$/, "");
    if (!value) return root + "/";
    if (String(value).startsWith("http")) return value;
    const pathPart = String(value).startsWith("/") ? value : `/${value}`;
    return root + pathPart;
  });

  eleventyConfig.addCollection("sitemapPages", (api) => {
    const pages = api
      .getAll()
      .filter((item) => item.url && !item.data.sitemapExclude);
    const weight = (url) => {
      if (url === "/") return 0;
      return 1;
    };
    return pages.sort((a, b) => {
      const wa = weight(a.url);
      const wb = weight(b.url);
      if (wa !== wb) return wa - wb;
      return a.url.localeCompare(b.url);
    });
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    pathPrefix: "/",
  };
}
