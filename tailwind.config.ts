import type { Config } from 'tailwindcss';
const config: Config = { content: ['./app/**/*.{js,ts,jsx,tsx,mdx}','./components/**/*.{js,ts,jsx,tsx,mdx}'], theme: { extend: { colors: { ink:'#352541', coral:'#F27C69', butter:'#FFF1C8', lilac:'#DCCBFA', mint:'#CBE9D8', paper:'#FFFCF6' }, fontFamily: { sans:['Arial','Helvetica','sans-serif'] }, boxShadow: { soft:'0 14px 40px rgba(53,37,65,.09)' } } }, plugins: [] };
export default config;
