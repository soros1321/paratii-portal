/* @flow */

import React, { Fragment } from 'react'
import styled from 'styled-components'
import { List as ImmutableList } from 'immutable'

import Loader from 'components/foundations/Loader'
import SearchResult from 'components/widgets/SearchResult'
import Video from 'records/VideoRecords'

const Wrapper = styled.div`
  width: 1180px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  background: ${({ theme }) => theme.colors.Search.results.background};
`

const SearchTerm = styled.div`
  flex: 0 0 100px;
  min-height: 100px;
  display: flex;
  align-items: center;
  width: 100%;
  padding: 20px;
  padding-bottom: 10px;
  color: ${({ theme }) => theme.colors.Search.results.searchTerm.term};
`

const SearchTermPrompt = styled.span`
  display: inline-block;
  margin-right: 10px;
  color: ${({ theme }) => theme.colors.Search.results.searchTerm.prompt};
`

const ZeroState = styled.div`
  color: ${({ theme }) => theme.colors.Search.results.zeroState.text};
  height: 200px;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const Results = styled.div`
  width: 100%;
  flex: 1 0 auto;
  padding-bottom: 10px;
`

const LoaderWrapper = styled.div`
  width: 100%;
  display: flex;
  min-height: 400px;
  align-items: center;
`

const HasNextLink = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 60px;
  padding-top: 10px;
  padding-bottom: 20px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.Search.nextButton};
`

type Props = {
  hasNext: boolean,
  results: ImmutableList<Video>,
  searchForMoreVideos: () => Promise<void>,
  searchTerm: string,
  resultsLoading: boolean
}

class SearchResults extends React.Component<Props, void> {
  renderClickForMore () {
    const { hasNext, searchForMoreVideos } = this.props

    if (!hasNext) {
      return null
    }

    return (
      <HasNextLink onClick={searchForMoreVideos}>
        Click for more results
      </HasNextLink>
    )
  }

  renderSearchTerm () {
    const { searchTerm } = this.props

    return (
      <SearchTerm>
        <SearchTermPrompt>Results for: </SearchTermPrompt>
        {searchTerm}
      </SearchTerm>
    )
  }

  renderSearchResultsSection () {
    if (this.props.searchTerm) {
      if (!this.props.results.size) {
        return (
          <ZeroState>{`No results found for "${
            this.props.searchTerm
          }"`}</ZeroState>
        )
      }

      return (
        <Fragment>
          {this.renderSearchTerm()}
          {this.props.results.map((result: Video) => (
            <SearchResult key={result.get('id')} video={result} />
          ))}
        </Fragment>
      )
    }

    return <ZeroState>Enter some keywords above to search!</ZeroState>
  }

  render () {
    return (
      <Wrapper>
        <Results>
          {this.props.resultsLoading ? (
            <LoaderWrapper>
              <Loader height="50px" width="50px" />
            </LoaderWrapper>
          ) : (
            this.renderSearchResultsSection()
          )}
        </Results>
        {this.renderClickForMore()}
      </Wrapper>
    )
  }
}

export default SearchResults
