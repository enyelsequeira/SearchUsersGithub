import React, { useState, useEffect } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);
  //request
  const [request, setRequest] = useState(0);
  const [isloading, setIsLoading] = useState(false);
  const [error, setError] = useState({ show: false, msg: '' });

  // search for users

  const searchGithubUser = async (user) => {
    // toggleError
    toggleError();
    //setLoading
    setIsLoading(true);
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) => {
      console.log(err);
    });
    if (response) {
      setGithubUser(response.data);
      //repos
      const { login, followers_url } = response.data;

      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ])
        .then((results) => {
          const [repos, followers] = results;
          const status = 'fulfilled';
          if (repos.status === 'fulfilled') {
            setRepos(repos.value.data);
          }
          if (followers.status === 'fulfilled') {
            setFollowers(followers.value.data);
          }
        })
        .catch((err) => console.log(err));
    } else {
      toggleError(true, 'there is no user with that username');
    }
    checkRequest();
    setIsLoading(false);
  };
  //check rate
  const checkRequest = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;
        setRequest(remaining);
        if (remaining === 0) {
          toggleError(true, 'sorry you have exceeded your limit of requests');
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // error
  function toggleError(show = false, msg = '') {
    setError({
      show,
      msg,
    });
  }

  useEffect(checkRequest, []);

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        request,
        error,
        searchGithubUser,
        isloading,
      }}>
      {children}
    </GithubContext.Provider>
  );
};

export { GithubProvider, GithubContext };
