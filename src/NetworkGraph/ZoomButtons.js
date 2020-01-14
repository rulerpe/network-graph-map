// import { PropTypes, UI } from "js-common";
import React from "react";

export class ZoomButtons extends React.Component {
    static propTypes = {
        // onZoomIn: PropTypes.func.isRequired,
        // onZoomOut: PropTypes.func.isRequired,
    };

    render() {
        return (
            <div className="zoom-buttons">
                <div onClick={this.props.onZoomIn} className="zoom-in zoom-button">
                    <i className="far fa-pro-plus" />
                    {/* <UI.Icon regular name="plus" /> */}
                </div>
                <div onClick={this.props.onZoomOut} className="zoom-out zoom-button">
                    <i className="far fa-pro-minus" />
                    {/* <UI.Icon regular name="minus" /> */}
                </div>
            </div>
        );
    }
}
