
export interface GlobalState {
    userInfo?: {
        name?: string;
        avatar?: string;
        job?: string;
        organization?: string;
        location?: string;
        email?: string;
        userLoading?: boolean;
    },
    vditorToolbarPin: boolean,
}

const initialState: GlobalState = {
    userInfo: {
    },
    vditorToolbarPin: false,
};


const rootReducer = function store(state = initialState, action) {
    switch (action.type) {
        case 'update-userInfo': {
            const { userInfo = initialState.userInfo, userLoading } = action.payload;
            return {
                ...state,
                userLoading,
                userInfo,
            };
        }
        case 'toggle-vditor-toolbar-pin': {
            return {
                ...state,
                vditorToolbarPin: !state.vditorToolbarPin,
            };
        }
        default:
            return state
    }
}

export default rootReducer