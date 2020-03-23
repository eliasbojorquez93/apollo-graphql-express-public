const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const { RESTDataSource } = require('apollo-datasource-rest');

const BASE_URL = 'https://api.themoviedb.org/3/';
const ACCESS_TOKEN = 'MY_ACCESS_TOKEN';

const typeDefs = gql`
  type MovieDetails {
    id: ID!
    title: String!
    original_title: String!
    overview: String!
    poster_path: String
    backdrop_path: String
    release_date: String!
    revenue: String
    vote_average: String!
    vote_count: String
    homepage: String

  }

  type Movie {
    id: ID!
    title: String!
    vote_average: String!
    poster_path: String
  }

  type Query {
    movie(id: String): MovieDetails
    search(query: String): [Movie]
    trending(media_type: String, time_window: String): [Movie]
    top_rated: [Movie]
  }
`;

const resolvers = {
  Query: {
    movie: async (_source, { id }, { dataSources }) => dataSources.moviesAPI.getMovie(id),
    search: async (_source, {query}, {dataSources}) => dataSources.moviesAPI.searchMovies(query),
    trending: async (_source, { media_type, time_window }, { dataSources }) => dataSources.moviesAPI.getTrending(media_type, time_window),
    top_rated: async (_source, {}, { dataSources }) => dataSources.moviesAPI.getTopRated(),
  },
};

class MoviesAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = BASE_URL;
  }

  async searchMovies(query) {
    const data = await this.get(`search/movie`, {query, page: 1} , {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
      },
    })
    return data.results;
  }

  async getMovie(id) {
    return this.get(`movie/${id}`, {}, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
      },
    });
  }

  async getTrending(media_type, time_window) {
    const data = await this.get(`trending/${media_type}/${time_window}`, {}, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
      },
    });

    return data.results;
  }

  async getTopRated(page = 1) {
    const data = await this.get(`movie/top_rated`, {page}, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
      },
    })

    return data.results;
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => {
    return {
      moviesAPI: new MoviesAPI(),
    }
  },
  context: () => {
    return {
      token: ACCESS_TOKEN,
    }
  },
});

const app = express();
const path = '/';
server.applyMiddleware({ app, path });

app.listen({ port: 4000 }, () =>
  console.log('Now browse to http://localhost:4000' + server.graphqlPath)
);
