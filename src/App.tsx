import React, { useState } from 'react';
import './App.css';
import 'antd/dist/antd.dark.css';
import { Button, Card, Form, Input, Layout, Spin, Typography } from 'antd';
import { Parser } from 'json2csv';
import axios from 'axios';

interface GoogleAddress {
    results: {
        address_components: {
            long_name: string;
            short_name: string;
            types: string[];
        }[];
        formatted_address: string;

    }[];
    status: string
}

interface AddrMap {
    Address: string;
    Township: string;
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function App() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data: { addresses: string }) => {
        beegData(data.addresses.split('\n'));
    };

    const beegData = async (addresses: string[]) => {
        const addrArr: AddrMap[] = [];

        const apiKey = 'AIzaSyDT7IMCqKAwLyLGgXaCrp_DxXdvW-6tZG8';
        const baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';

        setLoading(true);
        for (const addr of addresses) {
            try {
                const response = await axios.get(baseUrl, {
                    params: {
                        address: addr,
                        key: apiKey
                    }
                });

                addrArr.push({
                    Address: addr,
                    Township: getTownship(response.data) || 'Unknown'
                });
            } catch (e) {
                console.error(e);
            }

            await sleep(50);
        }

        setLoading(false);

        const parser = new Parser({ fields: ['Address', 'Township'] });
        const file = new Blob([parser.parse(addrArr)], { type: 'text/csv' })
        const a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = 'townships.csv';
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }

    const getTownship = (response: GoogleAddress): string | null => {
        const townshipResults = [];

        if (response.status !== 'OK') {
            return null;
        }

        for (const result of response.results) {
            const level3 = result.address_components.find(comp => comp.types.includes('administrative_area_level_3'));
            const locality = result.address_components.find(comp => comp.types.includes('locality'));

            townshipResults.push(level3?.long_name || locality?.long_name || 'Unknown');
        }

        return townshipResults[0];
    }

    return (
        <Layout className="layout">
            <Layout.Content style={{padding: '0 50px'}}>
                <Spin spinning={loading} size="large">
                    <Card style={{margin: 100}}>
                        <Form form={form} onFinish={onSubmit}>
                            <Typography.Title>Enter Addresses</Typography.Title>
                            <Form.Item name="addresses" extra="New line separated!">
                                <Input.TextArea rows={10} size="large" />
                            </Form.Item>

                            <Form.Item>
                                <Button size="large" type="primary" htmlType="submit">Search!</Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Spin>
            </Layout.Content>
            <Layout.Footer style={{textAlign: 'center'}}>Love you Thomas {'<3'}</Layout.Footer>
        </Layout>
    );
}

export default App;
