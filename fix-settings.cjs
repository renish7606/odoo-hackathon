const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated.settings.tsx', 'utf8');

// 1. Add session to useStore inside SettingsPage
content = content.replace(
  '  const { settings, updateSettings } = useStore();',
  '  const { settings, updateSettings, session } = useStore();'
);

// 2. Add System Processes before the last two closing divs
content = content.replace(
  '      </SectionCard>\n    </div>\n  );\n}',
  `      </SectionCard>

      {/* ── System Processes ── */}
      <SectionCard title="System Processes" icon={RefreshCcw}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-slate-900">Trigger EOD Processing (Run Cron)</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Manually triggers the end-of-day background job that suspends drivers with expired licenses and logs activity.
            </p>
          </div>
          <button
            onClick={async () => {
              try {
                const res = await fetch("http://localhost:5000/api/analytics/trigger-cron", { 
                  method: "POST",
                  headers: {
                    "Authorization": \`Bearer \${session?.token}\`
                  }
                });
                const data = await res.json();
                toast.success(data.message);
                // Quick page refresh to reflect suspended drivers
                setTimeout(() => window.location.reload(), 1000);
              } catch (err: any) {
                toast.error("Failed to run cron job");
              }
            }}
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-colors"
          >
            Run Cron Job
          </button>
        </div>
      </SectionCard>
    </div>
  );
}`
);

// 3. Make sure to import toast and RefreshCcw if not already imported
if (!content.includes('import { toast }')) {
  content = content.replace(
    'import { useStore, type Settings } from "@/lib/transitops-store";',
    'import { useStore, type Settings } from "@/lib/transitops-store";\nimport { toast } from "sonner";'
  );
}

fs.writeFileSync('src/routes/_authenticated.settings.tsx', content);
