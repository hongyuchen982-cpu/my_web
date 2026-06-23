"use client";

import { useState } from "react";
import { useLang } from "@/components/language-provider";
import { t } from "@/lib/i18n";

import { inputClass, labelClass } from "@/lib/styles";

interface ProjectEditorProps {
  initialTitle?: string;
  initialDescription?: string;
  initialCategory?: string;
  initialStatus?: string;
  initialUrl?: string;
  initialGithub?: string;
  initialTechs?: string;
  initialSortOrder?: number;
  submitLabel: string;
}

export default function ProjectEditor({
  initialTitle = "",
  initialDescription = "",
  initialCategory = "",
  initialStatus = "active",
  initialUrl = "",
  initialGithub = "",
  initialTechs = "[]",
  initialSortOrder = 0,
  submitLabel,
}: ProjectEditorProps) {
  const { lang } = useLang();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [category, setCategory] = useState(initialCategory);
  const [status, setStatus] = useState(initialStatus);
  const [url, setUrl] = useState(initialUrl);
  const [github, setGithub] = useState(initialGithub);
  const [techs, setTechs] = useState(initialTechs);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);

  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <label htmlFor="title" className={labelClass}>
          {t("title", lang)}
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          placeholder={lang === "zh" ? "项目名称" : "Project name"}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className={labelClass}>
          {lang === "zh" ? "描述" : "Description"}
        </label>
        <textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={inputClass}
          placeholder={lang === "zh" ? "项目简介…" : "Project description…"}
        />
      </div>

      {/* Category + Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className={labelClass}>
            {lang === "zh" ? "分类" : "Category"}
          </label>
          <input
            id="category"
            name="category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
            placeholder={lang === "zh" ? "AI / 能源 / Web" : "AI / Energy / Web"}
          />
        </div>
        <div>
          <label htmlFor="status" className={labelClass}>
            {t("status", lang)}
          </label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputClass}
          >
            <option value="active">{t("active", lang)}</option>
            <option value="wip">{t("wip", lang)}</option>
            <option value="maintained">{t("maintained", lang)}</option>
            <option value="archived">{t("archived", lang)}</option>
          </select>
        </div>
      </div>

      {/* URL + GitHub */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="url" className={labelClass}>
            URL
          </label>
          <input
            id="url"
            name="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={inputClass}
            placeholder="https://…"
          />
        </div>
        <div>
          <label htmlFor="github" className={labelClass}>
            GitHub
          </label>
          <input
            id="github"
            name="github"
            type="url"
            value={github}
            onChange={(e) => setGithub(e.target.value)}
            className={inputClass}
            placeholder="https://github.com/…"
          />
        </div>
      </div>

      {/* Techs */}
      <div>
        <label htmlFor="techs" className={labelClass}>
          {lang === "zh" ? "技术栈 (JSON 数组)" : "Tech Stack (JSON array)"}
        </label>
        <input
          id="techs"
          name="techs"
          type="text"
          value={techs}
          onChange={(e) => setTechs(e.target.value)}
          className={inputClass}
          placeholder='["TypeScript", "Next.js", "Tailwind"]'
        />
        <p className="text-[10px] text-[var(--color-fg-muted)] mt-1 font-mono">
          {lang === "zh"
            ? "JSON 数组格式，例如：[\"React\", \"Python\", \"SQLite\"]"
            : "JSON array format. Example: [\"React\", \"Python\", \"SQLite\"]"}
        </p>
      </div>

      {/* Sort Order */}
      <div>
        <label htmlFor="sortOrder" className={labelClass}>
          {lang === "zh" ? "排序权重" : "Sort Order"}
        </label>
        <input
          id="sortOrder"
          name="sortOrder"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          className={`${inputClass} w-24`}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full py-2.5 px-4 bg-[var(--color-accent)] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all tracking-wide font-mono"
      >
        {submitLabel}
      </button>
    </div>
  );
}
