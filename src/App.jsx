import * as React from "react";
import axios from 'axios';

const storiesReducer = (state, action) => {
    switch (action.type) {
      case 'STORIES_FETCH_INIT':
        return {
          ...state,
          isLoading: true,
          isError: false,
        };
      case 'STORIES_FETCH_SUCCESS':
        return {
          ...state,
          isLoading: false,
          isError: false,
          data: action.payload,
        };
      case 'STORIES_FETCH_FAILURE':
        return {
          ...state,
          isLoading: false,
          isError: true
        };
      case 'REMOVE_STORY':
        return {
          ...state,
          data: state.data.filter((story)=> action.payload.objectID != story.objectID),
        };
      default:
        throw new Error();
    }
  };

const useStorageState = (key, initialState) => {
  const [value, setValue] = React.useState(
    localStorage.getItem(key) || initialState
  ); 
  React.useEffect(()=> {
    localStorage.setItem(key, value);
  }, [value, key]);  //if the values in this list (value,key) are changed, this effect will be triggered
  return [value, setValue];  //This is returning the value of the storage state, and a setter function
};

const API_ENDPOINT = 'https://hn.algolia.com/api/v1/search?query=';

const App = () => {

  const [searchTerm, setSearchTerm] = useStorageState('search', 'React');

  const [url, setUrl] = React.useState(
    `${API_ENDPOINT}${searchTerm}`
  );

  const [stories, dispatchStories] = React.useReducer(
    storiesReducer, 
    { data:[], isLoading: false, isError: false} //initializes states
  ); //This sets up stories as the state, and dispatchStories as the function that takes an object (action, payload)



  const handleFetchStories = React.useCallback(async () => {
    dispatchStories({ type: 'STORIES_FETCH_INIT'}); 

    const result = await axios.get(url);

    try {
      dispatchStories({
        type: 'STORIES_FETCH_SUCCESS',
        payload: result.data.hits,
      });
    }
    catch {
      dispatchStories({type: 'STORIES_FETCH_FAILURE'});
    }

  }, [url]);


  React.useEffect(() => {
    handleFetchStories();
  }, [handleFetchStories]);

  const handleRemoveStory = (item) => {
    dispatchStories({
      type: 'REMOVE_STORY',
      payload: item,
    });
  };

  const handleSearchInput = (event) => {
    setSearchTerm(event.target.value);
  }

  // const searchedStories = stories.data.filter(function (story) {
  //    return story.title.toLowerCase().includes(searchTerm.toLowerCase());
  // });



  const handleSearchSubmit = (event) => {
    setUrl(`${API_ENDPOINT}${searchTerm}`);
    event.preventDefault();
  };

  const SearchForm = ({
    searchTerm,
    onSearchInput,
    onSearchSubmit
  }) => 
 (
    <form onSubmit={onSearchSubmit}>
      <InputWithLabel 
        id="search" 
        value={searchTerm} 
        isFocused 
        onInputChange={onSearchInput}
      >
        <strong>Search:</strong>
      </InputWithLabel>

      <button type="submit" disabled={!searchTerm}>
        Submit
      </button>
    </form>
  );

  return (
    <div>
      <h1>My Hacker Stories</h1>

      <SearchForm 
        searchTerm={searchTerm}
        onSearchInput={handleSearchInput}
        onSearchSubmit={handleSearchSubmit}
      />

      <hr />

      {stories.isError && <p>Something went wrong ...</p>}

      {stories.isLoading ? (
        <p>Loading ...</p>
      ) : (
        <List
          list={stories.data}
          onRemoveItem={handleRemoveStory}
        />
      )}
    </div>
  );
}

  const InputWithLabel = ({ id, value, type = 'text', onInputChange, isFocused, children }) => {
    const inputRef = React.useRef();

    React.useEffect(() => {
      if (isFocused && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isFocused]);

    return (
    <>
      <label htmlFor={id}>{children}</label>
      &nbsp;
      {/* B */}
      <input ref={inputRef} id={id} type={type} value={value} autoFocus={isFocused} onChange={onInputChange} />
    </>
  );
}

const List = ({list, onRemoveItem}) => (
  <span>
    <ul>
      {list.map((item) => (
        <Item 
          key={item.objectID} 
          item={item}
          onRemoveItem={onRemoveItem} 
        />
      ))}
    </ul>
  </span>
)

const Item = ({item, onRemoveItem}) => {
  return (
    <li>
      <div><span><a href={item.url}>{item.title}</a></span></div>
      <span>{item.author}</span>
      <span>{item.num_comments}</span>
      <span>{item.points}</span>
      <span>
        <button type="button" onClick={() => onRemoveItem(item)}>Dismiss</button>
      </span>
    </li>
  );
}

export default App
