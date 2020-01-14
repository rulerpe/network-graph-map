// import { PropTypes, UI, t } from "js-common";
import React from "react";
import classnames from "classnames";

export class ToggleLayout extends React.Component {
    static propTypes = {
        // isHierarchy: PropTypes.bool.isRequired,
        // onSwithToNonTree: PropTypes.func.isRequired,
        // onSwithToTree: PropTypes.func.isRequired,
    };

    handleClick = () => {
        console.log("click");
        if (this.props.isHierarchy) {
            this.props.onSwithToNonTree();
        } else {
            this.props.onSwithToTree();
        }
    }

    render() {
        const label = this.props.isHierarchy
            ? "cluster"//<span><UI.Icon light fw name="chart-network" />{t.title("network-glue.cluster-view")}</span>
            : "tree";//<span><UI.Icon light fw name="network-wired" />{t.title("network-glue.tree-view")}</span>;

        const className = classnames("toggle-layout", this.props.className);

        return (
            <div className={className}>
                {/* <UI.LoaderButton */}
                <button
                    onClick={this.handleClick}
                    className="autowidth medium"
                    value={label} />
            </div>
        );
    }
}
