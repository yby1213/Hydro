import { NamedPage } from 'vj/misc/Page';
import request from 'vj/utils/request';
import React from 'react';
import { render } from 'react-dom';
import 'graphiql/graphiql.css';

const Logo = () => <span>Hydro API Console </span>;

// @ts-ignore

const page = new NamedPage('api', async () => {
  const [{ default: GraphiQL }, { buildSchema }, res] = await Promise.all([
    import('graphiql'),
    import('graphql'),
    request.get('/api?schema'),
  ]);
  // @ts-ignore
  GraphiQL.Logo = Logo;
  console.log(res);
  const App = () => (
    <GraphiQL
      schema={buildSchema(res.schema)}
      style={{ height: '100vh' }}
      fetcher={async (graphQLParams) => {
        const data = await fetch(
          '/api',
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(graphQLParams),
            credentials: 'same-origin',
          },
        );
        return data.json().catch(() => data.text());
      }}
    />
  );

  render(<App />, document.getElementById('graphiql'));
});

export default page;