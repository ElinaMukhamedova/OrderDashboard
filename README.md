В ходе реализации проекта возникла следующая проблема:
RetailCRM при считывании данных видит статус заказа new, но так как в его базе нет информации о наличии товаров, всем заказам присваивается статус offer replacement.
Проблема решена изменением статуса заказа непосредственно в Supabase.

Пример промпта:
how does this dashboard work? what is vercel and how does it get connected to supabase?
Ответ:
Supabase is your database (PostgreSQL). It stores the orders data and exposes a REST API. The sync script pulls orders from RetailCRM and writes them into Supabase tables.
Next.js (the dashboard/ folder) is a React framework that builds the web page. When someone visits the dashboard:
The server component (page.tsx) calls Supabase's API using the anon key to fetch orders
It aggregates the data (by date, by status, totals)
It renders the HTML with the KPI cards and passes chart data to the client components
The client components (OrdersChart.tsx) use Recharts to draw interactive charts in the browser
Vercel is a hosting platform made by the creators of Next.js. It:
Takes your code from GitHub (or via CLI deploy)
Builds the Next.js app
Hosts it on a public URL (e.g. your-project.vercel.app)
Re-deploys automatically when you push to GitHub
