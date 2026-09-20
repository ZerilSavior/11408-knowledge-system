// 应用入口：聚合各 ESM 模块的顶层符号到全局（零构建、显式模块注册表），再按原顺序启动。
import { WORDS_DATA } from '../data/words.js';
import { WORDS_RARE } from '../data/words-rare.js';
import { WORD_REL } from '../data/word-rel.js';

import * as M_data_diagrams_js from './data/diagrams.js';
import * as M_data_syllabus_js from './data/syllabus.js';
import * as M_data_topic_content_js from './data/topic-content.js';
import * as M_core_store_js from './core/store.js';
import * as M_core_cloud_js from './core/cloud.js';
import * as M_core_util_js from './core/util.js';
import * as M_core_md_render_js from './core/md-render.js';
import * as M_core_ui_shell_js from './core/ui-shell.js';
import * as M_features_study_loop_js from './features/study-loop.js';
import * as M_features_words_js from './features/words.js';
import * as M_features_plan_js from './features/plan.js';
import * as M_features_reading_js from './features/reading.js';
import * as M_features_exams_js from './features/exams.js';
import * as M_features_mindmap_js from './features/mindmap.js';
import * as M_features_notes_js from './features/notes.js';
import * as M_features_drawings_js from './features/drawings.js';
import * as M_features_maps_js from './features/maps.js';
import * as M_core_bootstrap_js from './core/bootstrap.js';
import * as M_core_app_init_js from './core/app-init.js';

const __NAMESPACES=[M_data_diagrams_js, M_data_syllabus_js, M_data_topic_content_js, M_core_store_js, M_core_cloud_js, M_core_util_js, M_core_md_render_js, M_core_ui_shell_js, M_features_study_loop_js, M_features_words_js, M_features_plan_js, M_features_reading_js, M_features_exams_js, M_features_mindmap_js, M_features_notes_js, M_features_drawings_js, M_features_maps_js, M_core_bootstrap_js, M_core_app_init_js];
for(const __ns of __NAMESPACES) Object.assign(globalThis, __ns);
Object.assign(globalThis, { WORDS_DATA, WORDS_RARE, WORD_REL });

// 启动序列（原内联脚本顶层调用，保持原相对顺序）
migrateLegacyItems();
if(!state.words) state.words={};
ensureAllReviews();
ensureLearningData();
init();
