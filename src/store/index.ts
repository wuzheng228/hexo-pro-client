import defaultSettings from '../settings.json';

export interface PostListItem {
  _id: string
  title: string
  cover: string
  permalink: string
  date: string
  updated: string
}

export interface PostListstate {
  posts: PostListItem[]
}

export interface GlobalState {
  settings?: typeof defaultSettings;
  userInfo?: {
    name?: string;
    avatar?: string;
    job?: string;
    organization?: string;
    location?: string;
    email?: string;
    permissions: Record<string, string[]>;
  };
  userLoading?: boolean;
  posts?: PostListItem[]
}

const initialState: GlobalState = {
  settings: defaultSettings,
  userInfo: {
    permissions: {},
  },
  posts: []
};

const rootRreducer = function store(state = initialState, action) {
  switch (action.type) {
    case 'update-settings': {
      const { settings } = action.payload;
      return {
        ...state,
        settings,
      };
    }
    case 'update-userInfo': {
      const { userInfo = initialState.userInfo, userLoading } = action.payload;
      return {
        ...state,
        userLoading,
        userInfo,
      };
    }
    case 'load_posts':
      console.log(action);

      return { ...state, posts: action.payload.posts }
    default:
      return state;
  }
}

export default rootRreducer
