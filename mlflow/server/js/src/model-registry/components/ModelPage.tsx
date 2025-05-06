/**
 * NOTE: this code file was automatically migrated to TypeScript using ts-migrate and
 * may contain multiple `any` type annotations and `@ts-expect-error` directives.
 * If possible, please improve types while making changes to this file. If the type
 * annotations are already looking good, please remove this comment.
 */

import React from 'react';
import { connect } from 'react-redux';
import {
  searchModelVersionsApi,
  getRegisteredModelApi,
  updateRegisteredModelApi,
  deleteRegisteredModelApi,
} from '../actions';
import { ModelView } from './ModelView';
import { getModelVersions } from '../reducers';
import LocalStorageUtils from '../../common/utils/LocalStorageUtils';
import { createMLflowRoutePath } from '../../common/utils/RoutingUtils';
import {MODEL_VERSIONS_SEARCH_TIMESTAMP_FIELD, MODEL_VERSIONS_PER_PAGE_COMPACT, AntdTableSortOrder } from '../constants';
import { ScrollablePageWrapper } from '../../common/components/ScrollablePageWrapper';
import RequestStateWrapper, { triggerError } from '../../common/components/RequestStateWrapper';
import { Spinner } from '../../common/components/Spinner';
import { ErrorView } from '../../common/components/ErrorView';
import { ModelRegistryRoutes } from '../routes';
import Utils from '../../common/utils/Utils';
import { getUUID } from '../../common/utils/ActionUtils';
import { injectIntl } from 'react-intl';
import { ErrorWrapper } from '../../common/utils/ErrorWrapper';
import { withRouterNext } from '../../common/utils/withRouterNext';
import type { WithRouterNextProps } from '../../common/utils/withRouterNext';
import { withErrorBoundary } from '../../common/utils/withErrorBoundary';
import ErrorUtils from '../../common/utils/ErrorUtils';
import { ErrorCodes } from '../../common/constants';

type ModelPageImplProps = WithRouterNextProps<{ subpage: string }> & {
  modelName: string;
  model?: any;
  modelVersions?: any[];
  emailSubscriptionStatus?: string;
  userLevelEmailSubscriptionStatus?: string;
  searchModelVersionsApi: (...args: any[]) => any;
  getRegisteredModelApi: (...args: any[]) => any;
  updateRegisteredModelApi: (...args: any[]) => any;
  deleteRegisteredModelApi: (...args: any[]) => any;
  setEmailSubscriptionStatusApi: (...args: any[]) => any;
  getEmailSubscriptionStatusApi: (...args: any[]) => any;
  getUserLevelEmailSubscriptionStatusApi: (...args: any[]) => any;
  searchEndpointsByModelNameApi: (...args: any[]) => any;
  intl?: any;
};

type ModelPageImplState = {
  orderByKey: string;
  orderByAsc: boolean;
  currentPage: number;
  maxResultsSelection: number;
  pageTokens: Record<number, string | null>;
  loading: boolean;
  error: Error | undefined;
  tagSearchInput: string;
};

export class ModelPageImpl extends React.Component<ModelPageImplProps, ModelPageImplState> {
  constructor(props: ModelPageImplProps) {
      super(props);
      this.state = {
        orderByKey: MODEL_VERSIONS_SEARCH_TIMESTAMP_FIELD,
        orderByAsc: false,
        currentPage: 1,
        maxResultsSelection: this.getPersistedMaxResults(),
        pageTokens: {},
        loading: true,
        error: undefined,
        tagSearchInput: this.getModelVersionsTagSearchFiltersFromUrlState(this.getUrlState() as Record<string, string>),
      };
    }
  modelPageStoreKey = 'ModelPageStore';

  defaultPersistedPageTokens = { 1: null };
  initSearchModelVersionsApiRequestId = getUUID();
  SearchModelVersionsApiRequestId = getUUID();
  initgetRegisteredModelApiRequestId = getUUID();
  getRegisteredModelApiRequestId = getUUID();
  updateRegisteredModelApiId = getUUID();
  deleteRegisteredModelApiId = getUUID();

  criticalInitialRequestIds = [this.initSearchModelVersionsApiRequestId, this.initgetRegisteredModelApiRequestId];
  
  componentDidMount() {
    const urlState = this.getUrlState();
    const persistedPageTokens = this.getPersistedPageTokens();
    const maxResultsForTokens = this.getPersistedMaxResults();
    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState(
      {
        // @ts-expect-error TS(4111): Property 'orderByKey' comes from an index signatur... Remove this comment to see the full error message
        orderByKey: urlState.orderByKey === undefined ? this.state.orderByKey : urlState.orderByKey,
        orderByAsc:
          // @ts-expect-error TS(4111): Property 'orderByAsc' comes from an index signatur... Remove this comment to see the full error message
          urlState.orderByAsc === undefined
            ? this.state.orderByAsc
            : // @ts-expect-error TS(4111): Property 'orderByAsc' comes from an index signatur... Remove this comment to see the full error message
              urlState.orderByAsc === 'true',
        currentPage:
          // @ts-expect-error TS(4111): Property 'page' comes from an index signature, so ... Remove this comment to see the full error message
          urlState.page !== undefined && (urlState as any).page in persistedPageTokens
            ? // @ts-expect-error TS(2345): Argument of type 'unknown' is not assignable to pa... Remove this comment to see the full error message
              parseInt(urlState.page, 10)
            : this.state.currentPage,
        maxResultsSelection: maxResultsForTokens,
        pageTokens: persistedPageTokens,
      },
      () => {
        this.loadModelVersions(true);
      },
    );
  }

  getUrlState() {
    return this.props.location ? Utils.getSearchParamsFromUrl(this.props.location.search) : {};
  }

  parseTagFiltersFromTagSearchInput(tagSearchInput: string): string {
    const tagFilters = tagSearchInput
      .split(' AND ')
      .map((tagFilter: string) => {
        return tagFilter.trim();
      })
      .filter((tagFilter: string) => {
        return tagFilter.startsWith('tags.');
      });
    return tagFilters.join(' AND ');
  }

  getModelVersionsTagSearchFiltersFromUrlState(urlState: Record<string, string>): string {
    const tagSearchInput = 'tagSearchInput' in urlState ? urlState['tagSearchInput'] : '';
    return this.parseTagFiltersFromTagSearchInput(tagSearchInput);
  }

  updateUrlWithSearchFilter = (tagSearchInput: any, orderByKey: any, orderByAsc: any, page: any) => {
    const urlParams = {};
    if (tagSearchInput) {
      // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      urlParams['tagSearchInput'] = tagSearchInput;
    }
    if (orderByAsc === false) {
      // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      urlParams['orderByAsc'] = orderByAsc;
    }
    if (page && page !== 1) {
      // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      urlParams['page'] = page;
    }
    const newUrl = createMLflowRoutePath(`/models?${Utils.getSearchUrlFromState(urlParams)}`);
    if (newUrl !== this.props.location.pathname + this.props.location.search) {
      this.props.navigate(newUrl);
    }
  };
  // Loads the initial set of model versions.
  loadModelVersions(isInitialLoading = false) {
    this.loadPage(this.state.currentPage, isInitialLoading);
  }
  /**
   * Returns a LocalStorageStore instance that can be used to persist data associated with the
   * ModelRegistry component.
   */
  static getLocalStore(key: any) {
    return LocalStorageUtils.getSessionScopedStoreForComponent('ModelPage', key);
  }
 
  getPersistedPageTokens() {
    const store = ModelPageImpl.getLocalStore(this.modelPageStoreKey);
    if (store && store.getItem('page_tokens')) {
      return JSON.parse(store.getItem('page_tokens'));
    } else {
      return this.defaultPersistedPageTokens;
    }
  }

  setPersistedPageTokens(page_tokens: any) {
    const store = ModelPageImpl.getLocalStore(this.modelPageStoreKey);
    if (store) {
      store.setItem('page_tokens', JSON.stringify(page_tokens));
    }
  }

  getPersistedMaxResults() {
    const store = ModelPageImpl.getLocalStore(this.modelPageStoreKey);
    if (store && store.getItem('max_results')) {
      return parseInt(store.getItem('max_results'), 10);
    } else {
      return MODEL_VERSIONS_PER_PAGE_COMPACT;
    }
  }
  setMaxResultsInStore(max_results: any) {
    const store = ModelPageImpl.getLocalStore(this.modelPageStoreKey);
    store.setItem('max_results', max_results.toString());
  }
  
  handleEditDescription = (description: any) => {
    const { model } = this.props;
    return this.props
      .updateRegisteredModelApi(model.name, description, this.updateRegisteredModelApiId)
      .then(this.loadPage(1, false));
  };

  handleDelete = () => {
    const { model } = this.props;
    return this.props.deleteRegisteredModelApi(model.name, this.deleteRegisteredModelApiId);
  };

  resetHistoryState() {
    this.setState((prevState: any) => ({
      currentPage: 1,
      pageTokens: this.defaultPersistedPageTokens,
    }));
    this.setPersistedPageTokens(this.defaultPersistedPageTokens);
  }
  
  static getOrderByExpr = (orderByKey: any, orderByAsc: any) =>
    orderByKey ? `${orderByKey} ${orderByAsc ? 'ASC' : 'DESC'}` : '';

  isEmptyPageResponse = (value: any) => {
    return !value || !value.model_versions || !value.next_page_token;
  };
  
  loadPage = (page: any, isInitialLoading: any) => {
    const { modelName } = this.props;
    const {
      tagSearchInput,
      pageTokens,
      orderByKey,
      orderByAsc,
      // eslint-disable-nextline
    } = this.state;
    this.setState({ loading: true, error: undefined });
    this.updateUrlWithSearchFilter(tagSearchInput, orderByKey, orderByAsc, page);
    const filters = ['name=${modelName}'];
    if (tagSearchInput) {
      filters.push(this.parseTagFiltersFromTagSearchInput(tagSearchInput));
    }
    this.props
      .searchModelVersionsApi(
        filters.join(' AND '),
        this.state.maxResultsSelection,
        ModelPageImpl.getOrderByExpr(orderByKey, orderByAsc),
        pageTokens[page],
        isInitialLoading ? this.initgetRegisteredModelApiRequestId : this.SearchModelVersionsApiRequestId,
      )
      .then((r: any) => {
        this.updatePageState(page, r);
      })
      .catch((e: any) => {
        this.setState({ currentPage: 1, error: e });
        this.resetHistoryState();
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  };

  getNextPageTokenFromResponse(response: any) {
    const { value } = response;
    if (this.isEmptyPageResponse(value)) {
      // Why we could be here:
      // 1. There are no models returned: we went to the previous page but all models after that
      //    page's token has been deleted.
      // 2. If `next_page_token` is not returned, assume there is no next page.
      return null;
    } else {
      return value.next_page_token;
    }
  }

  updatePageState = (page: any, response = {}) => {
    const nextPageToken = this.getNextPageTokenFromResponse(response);
    this.setState(
      (prevState: any) => ({
        currentPage: page,

        pageTokens: {
          ...prevState.pageTokens,
          [page + 1]: nextPageToken,
        },
      }),
      () => {
        this.setPersistedPageTokens(this.state.pageTokens);
      },
    );
  };

  handleSearch = (tagSearchInput: any) => {
    this.resetHistoryState();
    this.setState({ tagSearchInput: tagSearchInput }, () => {
      this.loadPage(1, false);
    });
  };

  handleMaxResultsChange = (key: any) => {
    this.setState({ maxResultsSelection: parseInt(key, 10) }, () => {
      this.resetHistoryState();
      const { maxResultsSelection } = this.state;
      this.setMaxResultsInStore(maxResultsSelection);
      this.loadPage(1, false);
    });
  };

  handleClickNext = () => {
    const { currentPage } = this.state;
    this.loadPage(currentPage + 1, false);
  };

  handleClickPrev = () => {
    const { currentPage } = this.state;
    this.loadPage(currentPage - 1, false);
  };

  handleClickSortableColumn = (orderByKey: any, sortOrder: any) => {
    const orderByAsc = sortOrder !== AntdTableSortOrder.DESC; // default to true
    this.setState({ orderByKey, orderByAsc }, () => {
      this.resetHistoryState();
      this.loadPage(1, false);
    });
  };

  getMaxResultsSelection = () => {
    return this.state.maxResultsSelection;
  };

  render() {
    const { model, modelVersions, navigate, modelName } = this.props;
    const {
      orderByKey,
      orderByAsc,
      currentPage,
      pageTokens,
      tagSearchInput,
      // eslint-disable-nextline
    } = this.state;
    return (
      <ScrollablePageWrapper>
        <ModelView
          // @ts-expect-error TS(2322): Type '{ models: any[] | undefined; loading: any; e... Remove this comment to see the full error message
          models={models}
          loading={this.state.loading}
          error={this.state.error}
          tagSearchInput={tagSearchInput}
          orderByKey={orderByKey}
          orderByAsc={orderByAsc}
          currentPage={currentPage}
          nextPageToken={pageTokens[currentPage + 1]}
          onSearch={this.handleSearch}
          onClickNext={this.handleClickNext}
          onClickPrev={this.handleClickPrev}
          onClickSortableColumn={this.handleClickSortableColumn}
          onSetMaxResult={this.handleMaxResultsChange}
          maxResultValue={this.getMaxResultsSelection()}
        />
      </ScrollablePageWrapper>
    );
  }
}

const mapStateToProps = (state: any, ownProps: WithRouterNextProps<{ modelName: string }>) => {
  const modelName = decodeURIComponent(ownProps.params.modelName);
  const model = state.entities.modelByName[modelName];
  const modelVersions = getModelVersions(state, modelName);
  return {
    modelName,
    model,
    modelVersions,
  };
};

const mapDispatchToProps = {
  searchModelVersionsApi,
  getRegisteredModelApi,
  updateRegisteredModelApi,
  deleteRegisteredModelApi,
};

const ModelPageWithRouter = withRouterNext(
  // @ts-expect-error TS(2769): No overload matches this call.
  connect(mapStateToProps, mapDispatchToProps)(injectIntl(ModelPageImpl)),
);

export const ModelPage = withErrorBoundary(ErrorUtils.mlflowServices.MODEL_REGISTRY, ModelPageWithRouter);

export default ModelPage;
