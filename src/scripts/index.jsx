import '../style/theme.less';
import style from '../style/index.module.less';
import rocketImg from '../images/rocket.png';

import React from 'react';
import ReactDOM from 'react-dom';
import { Helmet } from 'react-helmet';
import PropTypes from 'prop-types';
import $ from 'jquery';
import _ from 'lodash';
import * as d3 from 'd3';
import { observable, runInAction, autorun } from 'mobx';
import { observer } from 'mobx-react';
import { Alert, Button, Select, Slider, Spin, Row, Col, Statistic } from 'antd';
import {
    CaretDownOutlined,
    CaretLeftOutlined,
    CaretRightOutlined,
    CaretUpOutlined,
    DoubleLeftOutlined,
    DoubleRightOutlined,
    LoadingOutlined,
    MinusOutlined,
    PlusOutlined,
    WarningOutlined,
    PlayCircleFilled,
    PauseCircleFilled,
    CloseOutlined,
} from '@ant-design/icons';
import { Scrollbar } from 'react-scrollbars-custom';

const { Option } = Select;

const checkDimension = () => {
    return $(window).width() >= 1175 && $(window).height() >= 500;
};

const gState = observable({
    loadingOverlayText: '',
    dimensionWarning: !checkDimension(),
    suppressDimensionWarning: false,
    scope: 'global',
    layer: 'download_kbps',
    timeSliderTicks: ['N/A'],
    timeSliderPos: 0,
    timeAutoPlay: false,
    highlightRegionName: '',
    highlightRegionDetails: [0, 0, 0],
    mapZoomScale: 1,
    detailBoxRegionName: '',
    scopeSwitchCount: 0,
});

window.addEventListener('resize', () => {
    runInAction(() => {
        gState.dimensionWarning = !checkDimension();
    });
});

const numberWithCommas = (x) =>
    x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const prettyPrintNetSpeed = (kbps, precision) => {
    if (kbps >= 1024) {
        return `${_.floor(kbps / 1024, precision)} Mbps`;
    } else {
        return `${_.floor(kbps, precision)} Kbps`;
    }
};

const gradientSteps = [0, 0.25, 0.5, 0.75, 1];
const gradientColors = ['#FA9B87', '#D4B168', '#D2EB80', '#68D499', '#84BDF5'];
const voidColor = '#727272';
const highlightColor = '#b3b3b3';

let geoData;
let monthlyData;
let layerExtents;

@observer
class LoadingOverlay extends React.Component {
    render() {
        return gState.loadingOverlayText ? (
            <div className={style.loadingOverlay}>
                <Spin
                    size="large"
                    indicator={<LoadingOutlined style={{ fontSize: 48 }} />}
                />
                <span className={style.loadingText}>
                    {gState.loadingOverlayText}
                </span>
                <span className={style.loadingHint}>
                    This may take up to one minute.
                </span>
            </div>
        ) : (
            <></>
        );
    }
}

@observer
class WarningBar extends React.Component {
    handleClose = () => {
        runInAction(() => {
            gState.suppressDimensionWarning = true;
        });
    };
    render() {
        return gState.dimensionWarning && !gState.suppressDimensionWarning ? (
            <div className={style.warningBar}>
                <Alert
                    icon={<WarningOutlined />}
                    type="warning"
                    message="The window size is too small and the content may not be displayed properly."
                    description="Please try expanding the window, reducing the browser zoom ratio, or using a device with a larger screen."
                    showIcon
                    closable
                    afterClose={this.handleClose}
                />
            </div>
        ) : (
            <></>
        );
    }
}

@observer
class ScopeSelector extends React.Component {
    onChange = (value) => {
        runInAction(() => {
            gState.scope = value;
        });
        this.props.onChanged(value);
    };

    render() {
        return (
            <Select
                style={{ width: '100%' }}
                value={gState.scope}
                onChange={this.onChange}
            >
                <Option value={'global'}>Global</Option>
            </Select>
        );
    }
}

ScopeSelector.propTypes = {
    onChanged: PropTypes.func,
};

@observer
class LayerSelector extends React.Component {
    onChange = (value) => {
        runInAction(() => {
            gState.layer = value;
        });
        this.props.onChanged(value);
    };

    render() {
        return (
            <Select
                style={{ width: '100%' }}
                value={gState.layer}
                onChange={this.onChange}
            >
                <Option value={'download_kbps'}>Download Speed</Option>
                <Option value={'upload_kbps'}>Upload Speed</Option>
                <Option value={'total_tests'}>Total Tests</Option>
            </Select>
        );
    }
}

LayerSelector.propTypes = {
    onChanged: PropTypes.func,
};

@observer
class PanControl extends React.Component {
    render() {
        return (
            <>
                <Button
                    type="primary"
                    shape="circle"
                    size="small"
                    className={style.panLeft}
                    onClick={this.props.panLeft}
                    icon={<CaretLeftOutlined />}
                />
                <Button
                    type="primary"
                    shape="circle"
                    size="small"
                    className={style.panRight}
                    onClick={this.props.panRight}
                    icon={<CaretRightOutlined />}
                />
                <Button
                    type="primary"
                    shape="circle"
                    size="small"
                    className={style.panUp}
                    onClick={this.props.panUp}
                    icon={<CaretUpOutlined />}
                />
                <Button
                    type="primary"
                    shape="circle"
                    size="small"
                    className={style.panDown}
                    onClick={this.props.panDown}
                    icon={<CaretDownOutlined />}
                />
            </>
        );
    }
}

PanControl.propTypes = {
    panUp: PropTypes.func,
    panDown: PropTypes.func,
    panLeft: PropTypes.func,
    panRight: PropTypes.func,
};

@observer
class ZoomControl extends React.Component {
    render() {
        return (
            <>
                <Button
                    type="primary"
                    shape="circle"
                    size="large"
                    className={style.zoomIn}
                    onClick={this.props.zoomIn}
                    disabled={gState.mapZoomScale >= this.props.maxScale}
                    icon={<PlusOutlined />}
                />
                <Button
                    type="primary"
                    shape="circle"
                    size="large"
                    className={style.zoomOut}
                    onClick={this.props.zoomOut}
                    disabled={gState.mapZoomScale <= this.props.minScale}
                    icon={<MinusOutlined />}
                />
            </>
        );
    }
}

ZoomControl.propTypes = {
    minScale: PropTypes.number,
    maxScale: PropTypes.number,
    zoomIn: PropTypes.func,
    zoomOut: PropTypes.func,
};

@observer
class TimeControl extends React.Component {
    decreaseTime = () => {
        runInAction(() => {
            if (gState.timeSliderPos !== 0) {
                gState.timeSliderPos--;
            }
        });
        this.props.setTime(gState.timeSliderPos);
    };

    increaseTime = () => {
        runInAction(() => {
            if (gState.timeSliderPos !== gState.timeSliderTicks.length - 1) {
                gState.timeSliderPos++;
            }
        });
        this.props.setTime(gState.timeSliderPos);
    };

    autoPlayTick = () => {
        if (gState.timeSliderPos !== gState.timeSliderTicks.length - 1) {
            runInAction(() => {
                gState.timeSliderPos++;
            });
            this.props.setTime(gState.timeSliderPos);
        } else {
            runInAction(() => {
                gState.timeAutoPlay = false;
            });
            clearInterval(this.timerId);
        }
    };

    toggleAutoPlay = () => {
        runInAction(() => {
            gState.timeAutoPlay = !gState.timeAutoPlay;
        });
        if (gState.timeAutoPlay) {
            this.timerId = setInterval(this.autoPlayTick, 1000);
        } else {
            clearInterval(this.timerId);
        }
    };

    render() {
        return (
            <>
                <Button
                    type="primary"
                    shape="circle"
                    size="large"
                    className={style.timeAutoPlay}
                    onClick={this.toggleAutoPlay}
                    icon={
                        !gState.timeAutoPlay ? (
                            <PlayCircleFilled />
                        ) : (
                            <PauseCircleFilled />
                        )
                    }
                />
                <Button
                    type="primary"
                    shape="circle"
                    className={style.timePrev}
                    onClick={this.decreaseTime}
                    icon={<DoubleLeftOutlined />}
                    disabled={gState.timeSliderPos === 0 || gState.timeAutoPlay}
                />
                <Button
                    type="primary"
                    shape="circle"
                    className={style.timeNext}
                    onClick={this.increaseTime}
                    icon={<DoubleRightOutlined />}
                    disabled={
                        gState.timeSliderPos ===
                            gState.timeSliderTicks.length - 1 ||
                        gState.timeAutoPlay
                    }
                />
                <div className={style.timeSlider}>
                    <Slider
                        min={0}
                        max={gState.timeSliderTicks.length - 1}
                        defaultValue={0}
                        value={gState.timeSliderPos}
                        tipFormatter={null}
                        onChange={(value) => {
                            runInAction(() => {
                                gState.timeSliderPos = value;
                            });
                        }}
                        onAfterChange={this.props.setTime}
                        disabled={gState.timeAutoPlay}
                    />
                </div>
            </>
        );
    }
}

TimeControl.propTypes = {
    setTime: PropTypes.func,
};

@observer
class InfoTexts extends React.Component {
    render() {
        return (
            <>
                {gState.highlightRegionName ? (
                    <>
                        <span className={style.detailText}>
                            {gState.highlightRegionDetails[2] > 0 ? (
                                <>
                                    Download Speed:{' '}
                                    {prettyPrintNetSpeed(
                                        gState.highlightRegionDetails[0],
                                        2
                                    )}
                                    <br />
                                    Upload Speed:{' '}
                                    {prettyPrintNetSpeed(
                                        gState.highlightRegionDetails[1],
                                        2
                                    )}
                                    <br />
                                    Total Tests:{' '}
                                    {numberWithCommas(
                                        gState.highlightRegionDetails[2]
                                    )}
                                </>
                            ) : (
                                <>
                                    Download Speed: No Record
                                    <br />
                                    Upload Speed: No Record
                                    <br />
                                    Total Tests: 0
                                </>
                            )}
                        </span>
                        <span className={style.regionNameText}>
                            {gState.highlightRegionName}
                        </span>
                    </>
                ) : (
                    <></>
                )}
                <span className={style.timeText}>
                    {gState.timeSliderTicks[gState.timeSliderPos]}
                </span>
                <span className={style.creditText}>
                    Zoom Level: {_.floor(gState.mapZoomScale, 3)}X<br />
                    Speed Test Data from{' '}
                    <a href={'https://www.ookla.com/'} rel={'nofollow'}>
                        Ookla
                    </a>
                    <br />
                    Map Data from{' '}
                    <a href={'https://gadm.org/'} rel={'nofollow'}>
                        GADM
                    </a>
                </span>
            </>
        );
    }
}

@observer
class MapOverlay extends React.Component {
    render() {
        return (
            <div
                className={style.mapOverlay}
                style={{
                    width: gState.detailBoxRegionName
                        ? 'calc(100% - 360px)'
                        : '100%',
                }}
            >
                <PanControl {...this.props} />
                <ZoomControl {...this.props} />
                <TimeControl {...this.props} />
                <InfoTexts />
            </div>
        );
    }
}

MapOverlay.propTypes = {
    ...PanControl.propTypes,
    ...ZoomControl.propTypes,
    ...TimeControl.propTypes,
};

@observer
class TrendSubplot extends React.Component {
    d3Ref = React.createRef();
    w = 360;
    h = 280;
    xPadding = 60;
    yPadding = 20;

    drawAxes = () => {
        [gState.scopeSwitchCount, gState.detailBoxRegionName];
        if (!monthlyData) {
            return;
        }
        const xDomain = [
            new Date(monthlyData.date[0]),
            new Date(monthlyData.date[monthlyData.date.length - 1]),
        ];

        this.xScale = d3
            .scaleTime()
            .domain(xDomain)
            .range([this.xPadding, this.w - this.xPadding / 2]);
        let xAxis = d3.axisBottom(this.xScale);
        this.xAxisGroup.call(xAxis);

        let yMax = 0;
        if (monthlyData['countries'][gState.detailBoxRegionName]) {
            yMax = d3.max(
                monthlyData['countries'][gState.detailBoxRegionName][
                    gState.layer
                ]
            );
        }
        let yDomain = [0, yMax];
        this.yScale = d3
            .scaleLinear()
            .domain(yDomain)
            .range([this.h - this.yPadding, this.yPadding / 2]);
        let yAxis = d3.axisLeft(this.yScale);
        this.yAxisGroup.call(yAxis);
        this.lineGenerator = d3
            .line()
            .x((d) => this.xScale(d.date))
            .y((d) => this.yScale(d.value));
    };

    drawLine = () => {
        [gState.detailBoxRegionName];
        if (!monthlyData) {
            return;
        }
        let data;
        if (monthlyData['countries'][gState.detailBoxRegionName]) {
            data = monthlyData['countries'][gState.detailBoxRegionName][
                gState.layer
            ].map((d, i) => ({
                date: new Date(monthlyData.date[i]),
                value: d,
            }));
        } else {
            data = [
                {
                    date: monthlyData.date[0],
                    value: 0,
                },
            ];
        }
        this.graphGroup
            .selectAll('.line')
            .transition()
            .duration(200)
            .attr('opacity', 0)
            .remove();
        this.graphGroup
            .append('path')
            .classed('line', true)
            .attr('d', this.lineGenerator(data))
            .attr('fill', 'none')
            .attr('stroke', '#3057e2')
            .attr('stroke-width', 2)
            .attr('opacity', 0)
            .transition()
            .delay(200)
            .duration(200)
            .attr('opacity', 1);
    };

    drawTimeIndicator = () => {
        [gState.timeSliderPos, gState.scopeSwitchCount];
        if (!monthlyData) {
            return;
        }
        this.timeIndicator
            .attr(
                'x1',
                this.xScale(new Date(monthlyData['date'][gState.timeSliderPos]))
            )
            .attr(
                'x2',
                this.xScale(new Date(monthlyData['date'][gState.timeSliderPos]))
            )
            .attr('y1', this.h - this.yPadding)
            .attr('y2', this.yPadding / 2);
    };

    componentDidMount() {
        this.svg = d3
            .select(this.d3Ref.current)
            .style('width', '100%')
            .attr('viewBox', `0 0 ${this.w} ${this.h}`)
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr('stroke', '#000000')
            .attr('color', '#000000');
        this.xAxisGroup = this.svg
            .append('g')
            .attr('class', 'xAxisGroup')
            .attr('transform', 'translate(0,' + (this.h - this.yPadding) + ')');
        this.yAxisGroup = this.svg
            .append('g')
            .attr('class', 'yAxisGroup')
            .attr('transform', 'translate(' + this.xPadding + ',0)');
        this.graphGroup = this.svg.append('g').attr('class', 'graphGroup');
        this.timeIndicator = this.svg
            .append('line')
            .classed('timeIndicator', true)
            .attr('stroke', '#ff2e2e')
            .attr('stroke-width', 1.5);
        this.axesARD = autorun(this.drawAxes);
        this.dataARD = autorun(this.drawLine);
        this.timeIndicatorARD = autorun(this.drawTimeIndicator);
    }

    componentWillUnmount() {
        this.axesARD();
        this.dataARD();
        this.timeIndicatorARD();
    }

    render() {
        return <svg ref={this.d3Ref} />;
    }
}

@observer
class DetailBox extends React.Component {
    render() {
        return (
            <>
                <Button
                    type="ghost"
                    shape="round"
                    size="large"
                    icon={<CloseOutlined style={{ color: '#000000' }} />}
                    onClick={this.props.onClose}
                >
                    Close
                </Button>
                <Scrollbar
                    style={{
                        width: '100%',
                        height: 'calc(100% - 30px)',
                    }}
                >
                    <div className={style.scrollingContent}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Statistic
                                    title={
                                        gState.scope === 'global'
                                            ? 'Country/Region'
                                            : 'Region'
                                    }
                                    value={gState.detailBoxRegionName}
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Total Tests Taken"
                                    value={
                                        monthlyData &&
                                        monthlyData['countries'][
                                            gState.detailBoxRegionName
                                        ]
                                            ? numberWithCommas(
                                                  monthlyData['countries'][
                                                      gState.detailBoxRegionName
                                                  ]['total_tests'][
                                                      gState.timeSliderPos
                                                  ]
                                              )
                                            : '0'
                                    }
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Download Speed"
                                    value={
                                        monthlyData &&
                                        monthlyData['countries'][
                                            gState.detailBoxRegionName
                                        ] &&
                                        monthlyData['countries'][
                                            gState.detailBoxRegionName
                                        ]['total_tests'][gState.timeSliderPos] >
                                            0
                                            ? prettyPrintNetSpeed(
                                                  monthlyData['countries'][
                                                      gState.detailBoxRegionName
                                                  ]['download_kbps'][
                                                      gState.timeSliderPos
                                                  ],
                                                  3
                                              )
                                            : 'No Record'
                                    }
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Upload Speed"
                                    value={
                                        monthlyData &&
                                        monthlyData['countries'][
                                            gState.detailBoxRegionName
                                        ] &&
                                        monthlyData['countries'][
                                            gState.detailBoxRegionName
                                        ]['total_tests'][gState.timeSliderPos] >
                                            0
                                            ? prettyPrintNetSpeed(
                                                  monthlyData['countries'][
                                                      gState.detailBoxRegionName
                                                  ]['upload_kbps'][
                                                      gState.timeSliderPos
                                                  ],
                                                  3
                                              )
                                            : 'No Record'
                                    }
                                />
                            </Col>
                        </Row>
                        <p className={style.sectionHeader}>Trend</p>
                        <TrendSubplot />
                    </div>
                </Scrollbar>
            </>
        );
    }
}

DetailBox.propTypes = {
    onClose: PropTypes.func,
};

@observer
class App extends React.Component {
    vizSvgRef = React.createRef();
    detailBoxRef = React.createRef();
    detailBox = false;

    initViz = () => {
        this.vizSvg = d3
            .select(this.vizSvgRef.current)
            .style('background-color', '#345a84');
        this.regionGroup = this.vizSvg.append('g').classed('regionGroup', true);
        this.mapZoom = d3
            .zoom()
            .scaleExtent([1, 25])
            .on('zoom', () => {
                runInAction(() => {
                    gState.mapZoomScale = d3.event.transform.k;
                });
                const transform = `translate(${d3.event.transform.x}, ${d3.event.transform.y}) scale(${d3.event.transform.k})`;
                this.regionGroup
                    .attr('transform', transform)
                    .attr('stroke-width', 2 / d3.event.transform.k);
            });
        this.vizSvg.call(this.mapZoom);
        // prepare for legend
        const svgDefs = this.vizSvg.append('defs');
        const gradient = svgDefs
            .append('linearGradient')
            .attr('id', 'scaleGradient')
            .attr('x1', 0)
            .attr('y1', 1)
            .attr('x2', 0)
            .attr('y2', 0);
        for (let i = 0; i < gradientSteps.length; i++) {
            gradient
                .append('stop')
                .attr('stop-color', gradientColors[i])
                .attr('offset', gradientSteps[i].toString());
        }
        this.legendGroup = this.vizSvg.append('g').classed('legendGroup', true);
    };

    drawViz = () => {
        if (!geoData) {
            return;
        }
        const layer = gState.layer;
        const dataGroup = this.regionGroup
            .selectAll('.region')
            .data(geoData.features);
        // regions
        const w = $(this.vizSvgRef.current).width();
        const h = $(this.vizSvgRef.current).height();
        const padding = 25;
        const projection = d3.geoMercator().fitExtent(
            [
                [padding, padding],
                [w - padding, h - padding],
            ],
            geoData
        );
        const pathMaker = d3.geoPath(projection);
        const colorScale = d3
            .scalePow()
            .domain(gradientSteps.map((x) => x * layerExtents[layer]))
            .range(gradientColors)
            .clamp(true);
        const getVal = (d, layer) => {
            if (monthlyData['countries'][d.properties['NAME']]) {
                return monthlyData['countries'][d.properties['NAME']][layer][
                    gState.timeSliderPos
                ];
            } else {
                return 0;
            }
        };
        const calcFillColor = (d) => {
            const val = getVal(d, gState.layer);
            if (val !== 0) {
                return colorScale(val);
            } else {
                return voidColor;
            }
        };
        // entering region
        dataGroup
            .enter()
            .append('path')
            .classed('region', true)
            .attr('d', pathMaker)
            .attr('fill-highlight', highlightColor)
            .attr('fill-normal', calcFillColor)
            .attr('download-kbps', (d) => getVal(d, 'download_kbps'))
            .attr('upload-kbps', (d) => getVal(d, 'upload_kbps'))
            .attr('total-tests', (d) => getVal(d, 'total_tests'))
            .attr('fill', calcFillColor)
            .on('mouseover', (d, i, nodes) => {
                if (gState.timeAutoPlay) {
                    return;
                }
                d3.select(nodes[i])
                    .transition()
                    .duration(200)
                    .attr('fill', d3.select(nodes[i]).attr('fill-highlight'));
                runInAction(() => {
                    gState.highlightRegionName = d.properties['NAME'];
                    gState.highlightRegionDetails = [
                        d3.select(nodes[i]).attr('download-kbps'),
                        d3.select(nodes[i]).attr('upload-kbps'),
                        d3.select(nodes[i]).attr('total-tests'),
                    ];
                });
            })
            .on('mouseout', (d, i, nodes) => {
                if (gState.timeAutoPlay) {
                    return;
                }
                d3.select(nodes[i])
                    .transition()
                    .duration(200)
                    .attr('fill', d3.select(nodes[i]).attr('fill-normal'));
                runInAction(() => {
                    gState.highlightRegionName = '';
                    gState.highlightRegionDetails = [0, 0, 0];
                });
            })
            .on('click', this.openDetailBox);
        // updating region
        dataGroup
            .attr('fill-normal', calcFillColor)
            .attr('download-kbps', (d) => getVal(d, 'download_kbps'))
            .attr('upload-kbps', (d) => getVal(d, 'upload_kbps'))
            .attr('total-tests', (d) => getVal(d, 'total_tests'))
            .transition()
            .duration(200)
            .attr('fill', calcFillColor);
        // exiting region
        dataGroup.exit().remove();
    };

    drawLegend = () => {
        const layer = gState.layer;
        const h = $(this.vizSvgRef.current).height();
        // draw legend
        this.legendGroup.selectAll('*').remove();
        this.legendGroup.attr('transform', `translate(25, ${h / 2 - 150})`);
        this.legendGroup
            .append('rect')
            .attr('fill', 'url(#scaleGradient)')
            .attr('width', 15)
            .attr('height', 200)
            .attr('rx', 4)
            .attr('ry', 4);
        this.legendGroup
            .append('rect')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2)
            .attr('rx', 4)
            .attr('ry', 4)
            .attr('fill', 'none')
            .attr('width', 15)
            .attr('height', 200);
        this.legendGroup
            .append('rect')
            .attr('fill', voidColor)
            .attr('width', 15)
            .attr('height', 15)
            .attr('y', 210)
            .attr('rx', 4)
            .attr('ry', 4);
        this.legendGroup
            .append('rect')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2)
            .attr('rx', 4)
            .attr('ry', 4)
            .attr('fill', 'none')
            .attr('width', 15)
            .attr('height', 15)
            .attr('y', 210);
        const legendTextScale = d3.scaleLinear().domain([1, 0]).range([6, 200]);
        for (let i = 0; i < gradientSteps.length; i++) {
            this.legendGroup
                .append('text')
                .classed('legendText', true)
                .attr('x', 20)
                .attr('y', legendTextScale(gradientSteps[i]))
                .text(
                    layer !== 'total_tests'
                        ? prettyPrintNetSpeed(
                              layerExtents[layer] * gradientSteps[i],
                              0
                          )
                        : numberWithCommas(
                              _.floor(layerExtents[layer] * gradientSteps[i], 0)
                          )
                );
        }
        this.legendGroup
            .append('text')
            .classed('legendText', true)
            .attr('x', 20)
            .attr('y', 221)
            .text('N/A');
    };

    setScope = async () => {
        const name = gState.scope;
        runInAction(() => {
            gState.loadingOverlayText = 'Loading map...';
        });
        geoData = await d3.json(`./${name}_map.geojson`);
        runInAction(() => {
            gState.loadingOverlayText = 'Loading data...';
        });
        monthlyData = await d3.json(`./${name}_monthly.json`);
        // calculate min and max
        layerExtents = {
            download_kbps:
                2.5 *
                d3.mean(
                    Object.entries(monthlyData['countries'])
                        .map((e) => e[1]['download_kbps'])
                        .map((e) => d3.max(e))
                ),
            upload_kbps:
                2.5 *
                d3.mean(
                    Object.entries(monthlyData['countries'])
                        .map((e) => e[1]['upload_kbps'])
                        .map((e) => d3.max(e))
                ),
            total_tests:
                2.5 *
                d3.mean(
                    Object.entries(monthlyData['countries'])
                        .map((e) => e[1]['total_tests'])
                        .map((e) => d3.max(e))
                ),
        };
        // notify
        runInAction(() => {
            gState.scopeSwitchCount++;
        });
        // set time ticks
        runInAction(() => {
            gState.timeSliderTicks = monthlyData.date;
        });
        runInAction(() => {
            gState.loadingOverlayText = 'Rendering visualization...';
        });
        this.drawViz();
        this.drawLegend();
        runInAction(() => {
            gState.loadingOverlayText = '';
        });
    };

    setLayer = () => {
        this.drawViz();
        this.drawLegend();
    };

    setTime = () => {
        this.drawViz();
    };

    zoomIn = () => {
        this.vizSvg.transition().call(this.mapZoom.scaleBy, 4 / 3);
    };

    zoomOut = () => {
        this.vizSvg.transition().call(this.mapZoom.scaleBy, 3 / 4);
    };

    panUp = () => {
        this.vizSvg
            .transition()
            .call(this.mapZoom.translateBy, 0, 30 / gState.mapZoomScale);
    };

    panDown = () => {
        this.vizSvg
            .transition()
            .call(this.mapZoom.translateBy, 0, -30 / gState.mapZoomScale);
    };

    panLeft = () => {
        this.vizSvg
            .transition()
            .call(this.mapZoom.translateBy, 30 / gState.mapZoomScale, 0);
    };

    panRight = () => {
        this.vizSvg
            .transition()
            .call(this.mapZoom.translateBy, -30 / gState.mapZoomScale, 0);
    };

    openDetailBox = (d, i, nodes) => {
        runInAction(() => {
            gState.detailBoxRegionName = d.properties['NAME'];
        });
        if (!this.detailBox) {
            this.detailBox = true;
            d3.select(this.detailBoxRef.current)
                .style('right', '-380px')
                .transition()
                .duration(500)
                .style('right', '0px');
        }
        this.vizSvg.selectAll('.region').attr('stroke', 'none');
        d3.select(nodes[i]).attr('stroke', '#ffd200');
    };

    closeDetailBox = () => {
        runInAction(() => {
            gState.detailBoxRegionName = '';
        });
        this.detailBox = false;
        this.vizSvg.selectAll('.region').attr('stroke', 'none');
        d3.select(this.detailBoxRef.current)
            .style('right', '0px')
            .transition()
            .style('right', '-380px');
    };

    updateDimension = _.debounce(() => {
        this.drawLegend();
    }, 500);

    componentDidMount() {
        window.addEventListener('resize', this.updateDimension);
        this.initViz();
        this.setScope().then();
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateDimension);
    }

    render() {
        return (
            <>
                <Helmet>
                    <link rel="shortcut icon" href={rocketImg} />
                    <title>Internet Service Quality Visualizer</title>
                </Helmet>
                <LoadingOverlay />
                <WarningBar />
                <div className={style.headerBar}>
                    <span className={style.title}>
                        Internet Service Quality Visualizer
                    </span>
                    <span className={style.scopeText}>Scope:</span>
                    <div className={style.scopeSelector}>
                        <ScopeSelector onChanged={this.setScope} />
                    </div>
                    <span className={style.layerText}>Layer:</span>
                    <div className={style.layerSelector}>
                        <LayerSelector onChanged={this.setLayer} />
                    </div>
                </div>
                <div className={style.contentBox}>
                    <svg className={style.map} ref={this.vizSvgRef} />
                    <MapOverlay
                        minScale={1}
                        maxScale={25}
                        zoomIn={this.zoomIn}
                        zoomOut={this.zoomOut}
                        panUp={this.panUp}
                        panDown={this.panDown}
                        panLeft={this.panLeft}
                        panRight={this.panRight}
                        setTime={this.setTime}
                    />
                    <div className={style.detailBox} ref={this.detailBoxRef}>
                        <DetailBox onClose={this.closeDetailBox} />
                    </div>
                </div>
            </>
        );
    }
}

ReactDOM.render(<App />, document.getElementById('root'));
