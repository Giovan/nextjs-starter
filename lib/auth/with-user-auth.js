import Router from 'next/router';
import { whoAmI } from '../../components/login/actions';

export function makeRedirect(ctx, toUrl) {
  const { req, res } = ctx;
  const isServer = !!req;
  if (isServer) {
    res.writeHead(302, {
      Location: `${toUrl}?next=${req.originalUrl}`
    });
    res.end();
  } else {
    Router.push(`${toUrl}?next=${ctx.asPath}`);
  }
}

const withUserAuth = WrappedComponent => {
  const withUserAuthWrapper = props => {
    return <WrappedComponent {...props} />;
  };

  withUserAuthWrapper.getInitialProps = async ctx => {
    const { reduxStore, req } = ctx;
    const isServer = !!req;
    let user = null;

    if (isServer) {
      // happens on page first load
      const { cookie } = req.headers;
      if (cookie) {
        user = await reduxStore.dispatch(whoAmI(cookie));
      }
    } else {
      // happens on client side navigation
      user = reduxStore.getState().auth.user;
    }

    if (!user) {
      makeRedirect(ctx, '/login');
    }

    let pageProps = {};
    if (typeof WrappedComponent.getInitialProps === 'function') {
      pageProps = await WrappedComponent.getInitialProps.call(WrappedComponent, ctx);
    }

    return { ...pageProps, user };
  };
  return withUserAuthWrapper;
};

export default withUserAuth;