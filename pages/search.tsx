import React from 'react';
import {useSelector} from 'react-redux';

import {Session} from 'next-auth';
import {getSession} from 'next-auth/react';
import getConfig from 'next/config';
import Head from 'next/head';

import {SearchResultContainer} from 'src/components/Search/SearchResultContainer';
import {TippingSuccess} from 'src/components/common/Tipping/render/Tipping.success';
import {DefaultLayout} from 'src/components/template/Default/DefaultLayout';
import {initialize} from 'src/lib/api/base';
import {healthcheck} from 'src/lib/api/healthcheck';
import i18n from 'src/locale';
import {RootState} from 'src/reducers';
import {fetchAvailableToken, fetchFilteredToken} from 'src/reducers/config/actions';
import {fetchExchangeRates} from 'src/reducers/exchange-rate/actions';
import {fetchFriend} from 'src/reducers/friend/actions';
import {countNewNotification} from 'src/reducers/notification/actions';
import {fetchServer} from 'src/reducers/server/actions';
import {
  fetchConnectedSocials,
  fetchUser,
  fetchUserExperience,
  fetchUserWallets,
  fetchNetwork,
} from 'src/reducers/user/actions';
import {UserState} from 'src/reducers/user/reducer';
import {wrapper} from 'src/store';
import {ThunkDispatchAction} from 'src/types/thunk';

const {publicRuntimeConfig} = getConfig();

type SearchProps = {
  session: Session;
};

const Search: React.FC<SearchProps> = props => {
  const {user, anonymous} = useSelector<RootState, UserState>(state => state.userState);

  if (!user && !anonymous) return null;

  return (
    <DefaultLayout isOnProfilePage={false} {...props}>
      <Head>
        <title>{i18n.t('Search.Title', {appname: publicRuntimeConfig.appName})}</title>
      </Head>

      <SearchResultContainer {...props} />

      <TippingSuccess />
    </DefaultLayout>
  );
};

export const getServerSideProps = wrapper.getServerSideProps(store => async context => {
  const {req} = context;

  const dispatch = store.dispatch as ThunkDispatchAction;

  let session: Session | null = null;

  try {
    session = await getSession(context);
  } catch {
    // ignore
  }

  if (!session?.user) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const sessionInstanceURL = session?.user?.instanceURL;

  const available = await healthcheck(sessionInstanceURL);

  if (!available) {
    return {
      redirect: {
        destination: '/maintenance',
        permanent: false,
      },
    };
  }

  initialize({cookie: req.headers.cookie});

  await dispatch(fetchUser());
  await Promise.all([
    dispatch(fetchServer(sessionInstanceURL)),
    dispatch(fetchNetwork()),
    dispatch(fetchAvailableToken()),
    dispatch(fetchFilteredToken()),
    dispatch(fetchExchangeRates()),
    dispatch(fetchUserExperience()),
    dispatch(fetchUserWallets()),
    dispatch(fetchConnectedSocials()),
    dispatch(fetchFriend()),
    dispatch(countNewNotification()),
  ]);

  return {
    props: {
      session,
    },
  };
});
export default Search;
