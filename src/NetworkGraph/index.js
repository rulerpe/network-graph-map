// import { PropTypes, UI } from "js-common";
import React from "react";
// import classnames from "classnames";
import { createDataSet, drawNetwork } from "./visjs/drawNetwork";
import { prepareData } from "./visjs/prepareData";
import { options } from "./visjs/options";
import { getCache, setCache } from "./visjs/cache";
import * as Rendering from "./helpers/nodeRendering";
import * as Clustering from "./helpers/clustering";
import * as Grouping from "./helpers/grouping";

function getIterations(nodes = []) {
    return nodes.length * 5;
}

class StatefulLoader extends React.PureComponent {
    state = {}
    show = () => this.setState({ hide: false });
    hide = () => this.setState({ hide: true });
    render () {
        return null;
        // TODO: implement loader
        // return (
            // <div className={classnames("dot-loader-container", !this.state.hide && "full-width full-height")}>
            //     {!this.state.hide && <UI.DotLoader dark={true} />}
            // </div>
        // );
    }
}

class NetworkGraph extends React.PureComponent {
    static propTypes = {
        // edges: PropTypes.arrayOf(PropTypes.object).affectsRendering,
        // nodes: PropTypes.arrayOf(PropTypes.object).affectsRendering,
        // filteredNodes: PropTypes.arrayOf(PropTypes.object).affectsRendering,
        // onHoverNode: PropTypes.func,
        // onBlurNode: PropTypes.func,
        // onError: PropTypes.func,
        // onSelectNode: PropTypes.func,
        // isHierarchy: PropTypes.bool.affectsRendering,
    };

    zoomIn = () => {
        Rendering.zoomIn(this._network, 0.25);
    };

    zoomOut = () => {
        Rendering.zoomIn(this._network, -0.25);
    };

    unselectNode = () => {
        this._network.unselectAll();
    }

    _groupByType = (isGrouping) => {
        if (!this._stabilized) {
            return;
        }
        if (this.loader) {
            this.loader.show();
        }
        setTimeout(() => {
            // find all clusters and open them
            let visibleButtons = Rendering.getVisibleToggleButtons(this._network, false);

            if (visibleButtons.length) {
                Clustering.openAllClusters(this._network, this.props.isHierarchy, visibleButtons);
            }

            if (isGrouping) {
                Grouping.groupAllLeavesByType(this._network, this._hasFilter);
            } else {
                Grouping.ungroupByType(this._network);
            }

            // close the clusters that were just opened in reverse order
            if (visibleButtons.length) {
                visibleButtons = visibleButtons
                    .map(id => id.replace("expand", "collapse"))
                    .reverse();

                Clustering.clusterAll(this._network, visibleButtons);
            }


            // TODO: [FED-4718] remove this hack
            // there is an issue after ungrouping if all clusteres are currently expanded:
            // the group size nodes are not hidden unless there is a collapse/expand action
            // this hack works by programmatically collapse and then expand a cluster to get around the issue
            if (!visibleButtons.length) {
                const collapseButtons = Rendering.getVisibleToggleButtons(this._network, true);

                if (collapseButtons.length) {
                    visibleButtons.push(collapseButtons[0]);
                    Clustering.clusterAll(this._network, visibleButtons);

                    visibleButtons = visibleButtons.map(id => id.replace("collapse", "expand"));
                    Clustering.openAllClusters(this._network, this.props.isHierarchy, visibleButtons);
                }
            }

            Rendering.scaleAndFixPositions(this._network, this.props.isHierarchy);

            this._network.redraw();

            if (this.loader) {
                this.loader.hide();
            }
        }, 10);
    }

    groupByType = () => {
        this._groupByType(true);
    }

    ungroupByType = () => {
        this._groupByType(false);
    }

    clusterAll = () => {
        if (!this._stabilized) {
            return;
        }

        const visibleButtons = Rendering.getVisibleToggleButtons(this._network, true);

        if (!visibleButtons.length) {
            return;
        }

        if (this.loader) {
            this.loader.show();
        }
        setTimeout(() => {
            Clustering.clusterAll(this._network, visibleButtons);
            Rendering.scaleAndFixPositions(this._network, this.props.isHierarchy);
            this._network.redraw();
            if (this.loader) {
                this.loader.hide();
            }
        }, 0);
    }

    openAllClusters = () => {
        if (!this._stabilized) {
            return;
        }

        const visibleButtons = Rendering.getVisibleToggleButtons(this._network, false);

        if (!visibleButtons.length) {
            return;
        }

        if (this.loader) {
            this.loader.show();
        }
        setTimeout(() => {
            Clustering.openAllClusters(this._network, this.props.isHierarchy, visibleButtons);
            Rendering.scaleAndFixPositions(this._network, this.props.isHierarchy);
            this._network.redraw();
            if (this.loader) {
                this.loader.hide();
            }
        }, 0);
    }

    _onZoom = ({ scale }) => {
        Rendering.handleZoom(this._network, scale);
    }

    _handleSelectNode = ({ nodes }) => {
        let nodeId = nodes[0];

        if (this._network.isCluster(nodeId)) {
            nodeId = Clustering.getNodeIdFromClusterNodeId(nodeId);
        }

        const resourceId = this._network.body.nodes[nodeId] ?.options.resourceId;

        if (resourceId) {
            this.props.onSelectNode(resourceId);
        } else if (nodes[0] && Grouping.isGroupId(nodes[0])) {
            this.props.onSelectGroup(Grouping.getGroupDetail(this._network, nodes[0]));
        }
    }

    _onClick = ({ nodes }) => {
        const nodeId = nodes[0];

        if (Rendering.isCollapseButton(nodeId)) {
            const forId = Rendering.getOwnerIdFromCollapseButtonId(nodeId);
            Rendering.toggleCollapseExpandButton(this._network, nodeId, forId);
            Clustering.cluster(this._network, forId);
        }
        else if (Rendering.isExpandButton(nodeId)) {
            const forId = Rendering.getOwnerIdFromExpandButtonId(nodeId);
            const clusterId = Clustering.createClusterNodeId(forId);
            if (this._network.isCluster(clusterId)) {
                Rendering.toggleCollapseExpandButton(this._network, nodeId, forId);
                Clustering.openCluster(this._network, clusterId, this.props.isHierarchy);
            }
        }

        Rendering.scaleAndFixPositions(this._network, this.props.isHierarchy);

        this._handleSelectNode({ nodes });
    }

    _onStabilizationIterationsDone = () => {
        if (this.loader) {
            this.loader.hide();
            this._network.stopSimulation();
        }

        this._network.storePositions();

        Rendering.createCollapseButtons(this._network);

        Rendering.createQuestionMarks(this._network);

        if (!this._hasFilter) {
            setCache(this.props.snapshot?.id, this.props.isHierarchy, this._dataSet);
        }

        Rendering.repositionNodesWithOffset(this._network);


        // this is a random hack to trigger the nodes in the tree view
        // to position themselves correctly after adding the custom nodes
        // TODO: comment it out to see what it does, and potentially find a better solution
        if (this.props.isHierarchy) {
            this._network.setOptions({
                groups: {}
            });
        }

        this._stabilized = true;
    }

    _onBeforeDrawing = (ctx) => Rendering.fillBackgroundColor(ctx);

    _setNetworkEventListners = (network) => {
        this._network = network;
        this._network.on("click", this._onClick);
        this._network.on("zoom", this._onZoom);
        this._network.on("stabilizationIterationsDone", this._onStabilizationIterationsDone);
        this._network.on("beforeDrawing", this._onBeforeDrawing);
    }

    async componentDidUpdate() {
        const { nodes, edges, filteredNodes, isHierarchy } = this.props;

        this._hasFilter = nodes && filteredNodes && nodes.length !== filteredNodes.length;

        if (nodes && edges && filteredNodes) {
            if (this.loader) {
                this.loader.show();
            }

            options.edges.smooth.enabled = isHierarchy;
            options.layout.hierarchical.enabled = isHierarchy;
            options.physics.stabilization.iterations = getIterations(nodes);

            try {
                const data = prepareData(this.props);

                const cache = await getCache(this.props.snapshot?.id, isHierarchy);
                // if there is cached graph data for non hierarchical layout, we can skip the physics simulation
                if (cache && !isHierarchy) {
                    options.physics.stabilization.iterations = 0;
                }

                if (cache?.nodes) {
                    const positions = cache.nodes;
                    data.nodes.map(n => {
                        n.x = positions[n.id].x;
                        n.y = positions[n.id].y;
                    });
                }

                // keep a reference of the DataSet used by visjs Network
                // because the network can only storePositions directly on the objects within this reference
                this._dataSet = createDataSet(data);

                this._stabilized = false;
                drawNetwork(this._setNetworkEventListners, this.props.onError, "network-graph-container", this._dataSet, options);
            } catch (error) {
                this.props.onError(error);
            }
        }
    }

    render() {
        return (
            <div className="graph-root" tabIndex={0}>
                <StatefulLoader ref={ref => this.loader = ref} />
                <div id="network-graph-container" />
            </div>
        );
    }
}

export default NetworkGraph ;
