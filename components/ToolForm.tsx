"use client";

import type { Category, Tag, Tool, ToolPlatform, ToolTag } from "@prisma/client";
import { useActionState, useState } from "react";
import { createToolAction, suggestToolMetadataAction, updateToolAction } from "@/app/admin/actions";
import { platformLabels, platforms } from "@/lib/platforms";
import { ToolStatus } from "@/lib/status";

type ToolWithRelations =
  | (Tool & {
      category: Category;
      platforms: ToolPlatform[];
      tags: (ToolTag & { tag: Tag })[];
    })
  | null;

type CategorySuggestion = Pick<Category, "id" | "name"> & {
  _count: { tools: number };
};

type TagSuggestion = Pick<Tag, "id" | "name"> & {
  _count: { tools: number };
};

function SuggestionButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-white/10 px-2.5 py-1.5 text-xs font-medium text-mist transition hover:border-accent/40 hover:bg-accent/10 hover:text-accent"
    >
      {children}
    </button>
  );
}

export function ToolForm({
  tool,
  categories = [],
  tags = []
}: {
  tool?: ToolWithRelations;
  categories?: CategorySuggestion[];
  tags?: TagSuggestion[];
}) {
  const action = tool ? updateToolAction.bind(null, tool.id) : createToolAction;
  const initialState: { error?: string } = {};
  const [state, formAction, pending] = useActionState(action, initialState);
  const [aiPending, setAiPending] = useState(false);
  const [aiError, setAiError] = useState("");
  const selectedPlatforms = new Set(tool?.platforms.map((item) => item.platform) || []);
  const selectedStatus = tool?.status || ToolStatus.DRAFT;
  const [nameValue, setNameValue] = useState(tool?.name || "");
  const [urlValue, setUrlValue] = useState(tool?.url || "");
  const [descriptionValue, setDescriptionValue] = useState(tool?.description || "");
  const [categoryValue, setCategoryValue] = useState(tool?.category.name || "");
  const [tagsValue, setTagsValue] = useState(tool?.tags.map(({ tag }) => tag.name).join(", ") || "");
  const popularCategories = categories.slice(0, 6);
  const remainingCategories = categories.slice(6);
  const popularTags = tags.slice(0, 10);
  const remainingTags = tags.slice(10);

  function addTag(tagName: string) {
    const existingTags = tagsValue
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (existingTags.some((tag) => tag.toLowerCase() === tagName.toLowerCase())) return;

    setTagsValue([...existingTags, tagName].join(", "));
  }

  async function suggestWithAi() {
    setAiError("");
    setAiPending(true);
    try {
      const suggestion = await suggestToolMetadataAction(urlValue);
      setDescriptionValue(suggestion.description);
      setCategoryValue(suggestion.category);
      setTagsValue(suggestion.tags.join(", "));
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "The AI suggestion could not be generated.");
    } finally {
      setAiPending(false);
    }
  }

  return (
    <form action={formAction} className="space-y-6 rounded-lg border border-white/10 bg-panel p-5">
      {state.error ? (
        <p className="rounded-md border border-red-300/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{state.error}</p>
      ) : null}
      {aiError ? (
        <p className="rounded-md border border-red-300/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{aiError}</p>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-paper">Name</span>
          <input name="name" value={nameValue} onChange={(event) => setNameValue(event.target.value)} required className="mt-2 h-11 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-paper outline-none focus:border-accent/60" />
        </label>
        <div className="block">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="url" className="text-sm font-semibold text-paper">Website or GitHub URL</label>
            <button
              type="button"
              onClick={suggestWithAi}
              disabled={aiPending || !urlValue.trim()}
              className="rounded-md border border-accent/40 px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {aiPending ? "Suggesting..." : "Suggest with AI"}
            </button>
          </div>
          <input id="url" name="url" type="url" value={urlValue} onChange={(event) => setUrlValue(event.target.value)} required className="mt-2 h-11 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-paper outline-none focus:border-accent/60" />
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-paper">Short description</span>
        <textarea name="description" value={descriptionValue} onChange={(event) => setDescriptionValue(event.target.value)} required rows={3} maxLength={240} className="mt-2 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-3 text-paper outline-none focus:border-accent/60" />
      </label>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="block">
          <label htmlFor="category" className="text-sm font-semibold text-paper">Category</label>
          <input id="category" name="category" list="category-options" value={categoryValue} onChange={(event) => setCategoryValue(event.target.value)} required className="mt-2 h-11 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-paper outline-none focus:border-accent/60" />
          <datalist id="category-options">
            {categories.map((category) => (
              <option key={category.id} value={category.name} />
            ))}
          </datalist>
          {categories.length ? (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-mist">Popular categories</p>
              <div className="flex flex-wrap gap-2">
                {popularCategories.map((category) => (
                  <SuggestionButton key={category.id} onClick={() => setCategoryValue(category.name)}>
                    {category.name} ({category._count.tools})
                  </SuggestionButton>
                ))}
              </div>
              {remainingCategories.length ? (
                <details className="text-xs text-mist">
                  <summary className="cursor-pointer font-medium text-accent">Show all categories</summary>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {remainingCategories.map((category) => (
                      <SuggestionButton key={category.id} onClick={() => setCategoryValue(category.name)}>
                        {category.name} ({category._count.tools})
                      </SuggestionButton>
                    ))}
                  </div>
                </details>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="block">
          <label htmlFor="tags" className="text-sm font-semibold text-paper">Tags</label>
          <input id="tags" name="tags" value={tagsValue} onChange={(event) => setTagsValue(event.target.value)} placeholder="CLI, Automation, Open Source" className="mt-2 h-11 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-paper outline-none focus:border-accent/60" />
          {tags.length ? (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-mist">Popular tags</p>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <SuggestionButton key={tag.id} onClick={() => addTag(tag.name)}>
                    {tag.name} ({tag._count.tools})
                  </SuggestionButton>
                ))}
              </div>
              {remainingTags.length ? (
                <details className="text-xs text-mist">
                  <summary className="cursor-pointer font-medium text-accent">Show all tags</summary>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {remainingTags.map((tag) => (
                      <SuggestionButton key={tag.id} onClick={() => addTag(tag.name)}>
                        {tag.name} ({tag._count.tools})
                      </SuggestionButton>
                    ))}
                  </div>
                </details>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-paper">Logo URL</span>
          <input name="logoUrl" type="url" defaultValue={tool?.logoUrl?.startsWith("/uploads/") ? "" : tool?.logoUrl || ""} placeholder="https://example.com/logo.png" className="mt-2 h-11 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-paper outline-none focus:border-accent/60" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-paper">Upload logo</span>
          <input name="logoFile" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon" className="mt-2 block w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-mist file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink" />
        </label>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-paper">Platforms</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {platforms.map((platform) => (
            <label key={platform} className="flex cursor-pointer items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm text-mist has-[:checked]:border-accent/50 has-[:checked]:bg-accent/10 has-[:checked]:text-accent">
              <input type="checkbox" name="platforms" value={platform} defaultChecked={selectedPlatforms.has(platform)} className="sr-only" />
              {platformLabels[platform]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-paper">Publishing</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm text-mist has-[:checked]:border-accent/50 has-[:checked]:bg-accent/10 has-[:checked]:text-accent">
            <input type="radio" name="status" value={ToolStatus.DRAFT} defaultChecked={selectedStatus === ToolStatus.DRAFT} className="sr-only" />
            Draft
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm text-mist has-[:checked]:border-accent/50 has-[:checked]:bg-accent/10 has-[:checked]:text-accent">
            <input type="radio" name="status" value={ToolStatus.PUBLISHED} defaultChecked={selectedStatus === ToolStatus.PUBLISHED} className="sr-only" />
            Published
          </label>
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <button disabled={pending} className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-[#8ff0e5] disabled:opacity-60">
          {pending ? "Saving..." : "Save tool"}
        </button>
        <a href="/admin/tools" className="rounded-md border border-white/10 px-4 py-2 text-sm font-medium text-mist hover:text-paper">
          Cancel
        </a>
      </div>
    </form>
  );
}
