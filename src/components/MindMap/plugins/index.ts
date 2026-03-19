export type { MindMapPlugin, ParseContext, LayoutContext, ParsedLineResult } from './types'

export { frontMatterPlugin } from './front-matter'
export { dottedLinePlugin } from './dotted-line'
export { foldingPlugin } from './folding'
export { multiLinePlugin } from './multi-line'
export { tagsPlugin } from './tags'
export { crossLinkPlugin } from './cross-link'
export { latexPlugin } from './latex'

import type { MindMapPlugin } from './types'
import { frontMatterPlugin } from './front-matter'
import { dottedLinePlugin } from './dotted-line'
import { foldingPlugin } from './folding'
import { multiLinePlugin } from './multi-line'
import { tagsPlugin } from './tags'
import { crossLinkPlugin } from './cross-link'
import { latexPlugin } from './latex'

/** All 7 plugins in recommended processing order */
export const allPlugins: MindMapPlugin[] = [
  frontMatterPlugin,
  dottedLinePlugin,
  foldingPlugin,
  multiLinePlugin,
  tagsPlugin,
  crossLinkPlugin,
  latexPlugin,
]
